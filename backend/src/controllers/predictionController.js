const prisma = require('../database/prisma')
const axios = require('axios')

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5030'

/**
 * Fetch historical data from database for training
 */
const fetchHistoricalData = async () => {
  try {
    // Calculate date 6 months ago
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Fetch visit data grouped by date and type
    const visits = await prisma.visit.groupBy({
      by: ['visitType'],
      where: {
        status: {
          in: ['COMPLETED', 'IN_PROGRESS']
        },
        scheduledAt: {
          gte: sixMonthsAgo
        }
      },
      _count: true
    })

    // Fetch detailed visit data for time series
    const visitData = {}
    const visitTypes = ['GENERAL_CHECKUP', 'OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'MEDICAL_ACTION']

    for (const visitType of visitTypes) {
      const data = await prisma.$queryRaw`
        SELECT 
          DATE(scheduled_at) as date,
          COUNT(*)::int as count
        FROM visits
        WHERE visit_type::text = ${visitType}
          AND status IN ('COMPLETED', 'IN_PROGRESS')
          AND scheduled_at >= ${sixMonthsAgo}
        GROUP BY DATE(scheduled_at)
        ORDER BY date
      `
      
      visitData[visitType] = data.map(row => {
        const dateStr = row.date instanceof Date 
          ? row.date.toISOString().split('T')[0] 
          : String(row.date).split('T')[0]
        return {
          date: dateStr,
          count: row.count
        }
      })
    }

    // Fetch room occupancy data grouped by room type
    const roomData = {}
    const roomTypes = ['VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION']

    for (const roomType of roomTypes) {
      const data = await prisma.$queryRaw`
        SELECT 
          DATE(ro.checked_in_at) as date,
          COUNT(*)::int as count
        FROM room_occupancies ro
        JOIN rooms r ON ro.room_id = r.id
        WHERE r.room_type::text = ${roomType}
          AND ro.checked_in_at >= ${sixMonthsAgo}
        GROUP BY DATE(ro.checked_in_at)
        ORDER BY date
      `
      
      roomData[roomType] = data.map(row => {
        const dateStr = row.date instanceof Date 
          ? row.date.toISOString().split('T')[0] 
          : String(row.date).split('T')[0]
        return {
          date: dateStr,
          count: row.count
        }
      })
    }

    return {
      visits: visitData,
      rooms: roomData
    }
  } catch (error) {
    console.error('Error fetching historical data:', error)
    throw error
  }
}

/**
 * Train ML models with historical data
 */
exports.trainModels = async (req, res) => {
  try {
    console.log('Fetching historical data for training...')
    
    // Fetch historical data from database
    const historicalData = await fetchHistoricalData()

    console.log('Sending data to ML service for training...')
    
    // Send data to Python ML service for training
    const response = await axios.post(`${ML_SERVICE_URL}/train`, historicalData, {
      timeout: 60000 // 60 seconds timeout
    })

    res.json({
      success: true,
      message: 'Models trained successfully',
      data: response.data
    })
  } catch (error) {
    console.error('Error training models:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'ML service is not available. Please ensure Python service is running on port 5030.'
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to train models'
    })
  }
}

/**
 * Get predictions from ML service
 */
exports.getPredictions = async (req, res) => {
  try {
    const { days = 7 } = req.body

    console.log(`Requesting predictions for ${days} days...`)

    // Request predictions from Python ML service
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, { days }, {
      timeout: 30000 // 30 seconds timeout
    })

    res.json({
      success: true,
      data: response.data
    })
  } catch (error) {
    console.error('Error getting predictions:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'ML service is not available. Please ensure Python service is running on port 5030.'
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get predictions'
    })
  }
}

/**
 * Check ML service health
 */
exports.checkHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    })

    res.json({
      success: true,
      mlService: response.data
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'ML service is not available',
      mlService: null
    })
  }
}
