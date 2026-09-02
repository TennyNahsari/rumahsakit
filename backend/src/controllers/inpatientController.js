const { validationResult } = require('express-validator');
const prisma = require('../database/prisma');
const XLSX = require('xlsx');

// Generate unique Registration Number for inpatient
const generateRegistrationNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `INP${year}${month}${day}`;
  
  // Find the last registration for today
  const lastOccupancy = await prisma.roomOccupancy.findFirst({
    where: {
      registrationNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      registrationNumber: 'desc'
    }
  });

  let sequence = 1;
  if (lastOccupancy) {
    const lastSequence = parseInt(lastOccupancy.registrationNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// Calculate days between two dates
const calculateDays = (checkIn, checkOut) => {
  const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Minimum 1 day
};

// @desc    Get all active inpatients
// @route   GET /api/inpatients
// @access  Private
const getInpatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { roomType, floor, doctorId, search, startDate, endDate, status } = req.query;
    
    // Build where clause
    const where = {};

    if (status && status !== 'ALL') {
      if (status === 'CHECKED_IN') {
        where.status = { in: ['CHECKED_IN', 'ACTIVE'] };
      } else {
        where.status = status;
      }
    } else if (!status) {
      where.status = { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE'] };
    }
    
    if (search) {
      where.OR = [
        {
          patient: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          patient: {
            medicalRecordNo: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }
    
    if (doctorId) {
      where.doctorId = parseInt(doctorId);
    }
    
    if (roomType) {
      where.room = {
        roomType
      };
    }
    
    if (floor) {
      where.room = {
        ...where.room,
        floor: parseInt(floor)
      };
    }
    
    if (startDate && endDate) {
      where.checkedInAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const [occupancies, total] = await Promise.all([
      prisma.roomOccupancy.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          checkedInAt: 'desc'
        },
        include: {
          patient: {
            select: {
              id: true,
              medicalRecordNo: true,
              name: true,
              gender: true,
              dateOfBirth: true,
              phone: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomName: true,
              roomType: true,
              floor: true,
              pricePerDay: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      }),
      prisma.roomOccupancy.count({ where })
    ]);
    
    // Calculate days for each occupancy
    const occupanciesWithDays = occupancies.map(occ => {
      const days = calculateDays(occ.checkedInAt, new Date());
      return {
        ...occ,
        currentDays: days
      };
    });
    
    res.json({
      success: true,
      data: {
        inpatients: occupanciesWithDays,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get inpatients error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching inpatients'
    });
  }
};

// @desc    Get single occupancy detail
// @route   GET /api/inpatients/:id
// @access  Private
const getInpatient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const occupancy = await prisma.roomOccupancy.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        room: true,
        doctor: {
          select: {
            id: true,
            name: true,
            department: true
          }
        },
        billing: true
      }
    });
    
    if (!occupancy) {
      return res.status(404).json({
        success: false,
        error: 'Inpatient record not found'
      });
    }
    
    const days = occupancy.checkedOutAt 
      ? occupancy.actualDays
      : calculateDays(occupancy.checkedInAt, new Date());
    
    res.json({
      success: true,
      data: {
        occupancy: {
          ...occupancy,
          currentDays: days
        }
      }
    });
  } catch (error) {
    console.error('Get inpatient error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching inpatient'
    });
  }
};

// @desc    Check-in patient to room
// @route   POST /api/inpatients/check-in
// @access  Private
const checkInPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const {
      patientId,
      roomId,
      bedNumber,
      doctorId,
      checkedInAt,
      estimatedCheckoutAt,
      initialDiagnosis,
      careClass,
      notes,
      status
    } = req.body;
    
    const occupancyStatus = status || 'PENDING';

    // Check if patient already has active or ongoing occupancy
    const existingOccupancy = await prisma.roomOccupancy.findFirst({
      where: {
        patientId: parseInt(patientId),
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE'] }
      }
    });
    
    if (existingOccupancy) {
      return res.status(400).json({
        success: false,
        error: 'Patient already has an active or pending room occupancy'
      });
    }
    
    // Check if room is available
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
      include: {
        occupancies: {
          where: { status: { in: ['CHECKED_IN', 'ACTIVE'] } }
        }
      }
    });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    if (room.status !== 'AVAILABLE' && room.status !== 'RESERVED') {
      return res.status(400).json({
        success: false,
        error: 'Room is not available for check-in'
      });
    }
    
    // Check bed availability for multi-bed rooms
    if (room.bedCapacity > 1) {
      if (!bedNumber) {
        return res.status(400).json({
          success: false,
          error: 'Bed number is required for multi-bed room'
        });
      }
      
      const bedOccupied = room.occupancies.some(occ => occ.bedNumber === parseInt(bedNumber));
      if (bedOccupied) {
        return res.status(400).json({
          success: false,
          error: 'Bed number is already occupied'
        });
      }
    }
    
    // Generate registration number
    const registrationNumber = await generateRegistrationNumber();
    
    // Create occupancy
    const occupancy = await prisma.roomOccupancy.create({
      data: {
        registrationNumber,
        patientId: parseInt(patientId),
        roomId: parseInt(roomId),
        bedNumber: bedNumber ? parseInt(bedNumber) : null,
        doctorId: parseInt(doctorId),
        checkedInAt: checkedInAt ? new Date(checkedInAt) : new Date(),
        estimatedCheckoutAt: estimatedCheckoutAt ? new Date(estimatedCheckoutAt) : null,
        initialDiagnosis,
        careClass,
        notes,
        status: occupancyStatus
      },
      include: {
        patient: true,
        room: true,
        doctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Update room status based on occupancy status
    if (occupancyStatus === 'CHECKED_IN' || occupancyStatus === 'ACTIVE') {
      await prisma.room.update({
        where: { id: parseInt(roomId) },
        data: { status: 'OCCUPIED' }
      });
    } else if (occupancyStatus === 'CONFIRMED') {
      await prisma.room.update({
        where: { id: parseInt(roomId) },
        data: { status: 'RESERVED' }
      });
    }
    
    res.status(201).json({
      success: true,
      data: { occupancy },
      message: 'Patient checked in successfully'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while checking in patient'
    });
  }
};

// @desc    Update occupancy (change room, doctor, diagnosis, status, etc)
// @route   PUT /api/inpatients/:id
// @access  Private
const updateOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomId,
      bedNumber,
      doctorId,
      estimatedCheckoutAt,
      initialDiagnosis,
      careClass,
      notes,
      status
    } = req.body;
    
    const occupancy = await prisma.roomOccupancy.findUnique({
      where: { id: parseInt(id) },
      include: { room: true }
    });
    
    if (!occupancy) {
      return res.status(404).json({
        success: false,
        error: 'Occupancy not found'
      });
    }
    
    if (occupancy.status === 'CHECKED_OUT' || occupancy.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update finished or cancelled occupancy'
      });
    }
    
    let newRoomId = occupancy.roomId;
    let newBedNumber = occupancy.bedNumber;
    
    // If changing room
    if (roomId && parseInt(roomId) !== occupancy.roomId) {
      const newRoom = await prisma.room.findUnique({
        where: { id: parseInt(roomId) },
        include: {
          occupancies: {
            where: { status: { in: ['CHECKED_IN', 'ACTIVE'] } }
          }
        }
      });
      
      if (!newRoom) {
        return res.status(404).json({
          success: false,
          error: 'New room not found'
        });
      }
      
      if (newRoom.status !== 'AVAILABLE' && newRoom.status !== 'RESERVED') {
        return res.status(400).json({
          success: false,
          error: 'New room is not available'
        });
      }
      
      // Check bed availability for multi-bed rooms
      if (newRoom.bedCapacity > 1) {
        if (!bedNumber) {
          return res.status(400).json({
            success: false,
            error: 'Bed number is required for multi-bed room'
          });
        }
        
        const bedOccupied = newRoom.occupancies.some(occ => occ.bedNumber === parseInt(bedNumber));
        if (bedOccupied) {
          return res.status(400).json({
            success: false,
            error: 'Bed number is already occupied in new room'
          });
        }
      }
      
      newRoomId = parseInt(roomId);
      newBedNumber = bedNumber ? parseInt(bedNumber) : null;
      
      // Update old room status
      const oldRoomActiveOccupancies = await prisma.roomOccupancy.count({
        where: {
          roomId: occupancy.roomId,
          status: { in: ['CHECKED_IN', 'ACTIVE'] },
          id: { not: parseInt(id) }
        }
      });
      
      if (oldRoomActiveOccupancies === 0) {
        await prisma.room.update({
          where: { id: occupancy.roomId },
          data: { status: 'CLEANING' }
        });
      }
      
      // Update new room status
      const newRoomWillBeFull = newRoom.occupancies.length + 1 >= newRoom.bedCapacity;
      await prisma.room.update({
        where: { id: parseInt(roomId) },
        data: { status: newRoomWillBeFull ? 'OCCUPIED' : 'OCCUPIED' }
      });
    }
    
    // Handle status change side-effects
    const newStatus = status || occupancy.status;
    if (newStatus !== occupancy.status) {
      if ((newStatus === 'CHECKED_IN' || newStatus === 'ACTIVE') && occupancy.status !== 'CHECKED_IN' && occupancy.status !== 'ACTIVE') {
        await prisma.room.update({
          where: { id: newRoomId },
          data: { status: 'OCCUPIED' }
        });
      } else if (newStatus === 'CONFIRMED' && occupancy.status !== 'CONFIRMED') {
        await prisma.room.update({
          where: { id: newRoomId },
          data: { status: 'RESERVED' }
        });
      } else if (newStatus === 'CHECKED_OUT' && occupancy.status !== 'CHECKED_OUT') {
        await prisma.room.update({
          where: { id: newRoomId },
          data: { status: 'CLEANING' }
        });
      } else if (newStatus === 'CANCELLED' && occupancy.status !== 'CANCELLED') {
        await prisma.room.update({
          where: { id: newRoomId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    // Update occupancy
    const updatedOccupancy = await prisma.roomOccupancy.update({
      where: { id: parseInt(id) },
      data: {
        ...(roomId && { roomId: newRoomId }),
        ...(bedNumber !== undefined && { bedNumber: newBedNumber }),
        ...(doctorId && { doctorId: parseInt(doctorId) }),
        ...(estimatedCheckoutAt && { estimatedCheckoutAt: new Date(estimatedCheckoutAt) }),
        ...(initialDiagnosis !== undefined && { initialDiagnosis }),
        ...(careClass !== undefined && { careClass }),
        ...(notes !== undefined && { notes }),
        ...(status && { status: newStatus })
      },
      include: {
        patient: true,
        room: true,
        doctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: { occupancy: updatedOccupancy },
      message: 'Occupancy updated successfully'
    });
  } catch (error) {
    console.error('Update occupancy error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating occupancy'
    });
  }
};

// @desc    Check-out patient from room
// @route   POST /api/inpatients/:id/check-out
// @access  Private
const checkOutPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      checkedOutAt,
      dischargeCondition,
      finalDiagnosis,
      dischargeNotes
    } = req.body;
    
    const occupancy = await prisma.roomOccupancy.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: true,
        patient: true
      }
    });
    
    if (!occupancy) {
      return res.status(404).json({
        success: false,
        error: 'Occupancy not found'
      });
    }
    
    if (occupancy.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Patient is not currently checked in'
      });
    }
    
    const checkOutDate = checkedOutAt ? new Date(checkedOutAt) : new Date();
    const actualDays = calculateDays(occupancy.checkedInAt, checkOutDate);
    const totalRoomCost = parseFloat(occupancy.room.pricePerDay) * actualDays;
    
    // Create billing entry
    const billing = await prisma.billing.create({
      data: {
        patientId: occupancy.patientId,
        visitId: null,
        items: [
          {
            name: `Room ${occupancy.room.roomNumber} - ${occupancy.room.roomType}`,
            quantity: actualDays,
            price: parseFloat(occupancy.room.pricePerDay),
            total: totalRoomCost
          }
        ],
        subtotal: totalRoomCost,
        tax: 0,
        discount: 0,
        total: totalRoomCost,
        status: 'UNPAID'
      }
    });
    
    // Update occupancy
    const updatedOccupancy = await prisma.roomOccupancy.update({
      where: { id: parseInt(id) },
      data: {
        checkedOutAt: checkOutDate,
        actualDays,
        totalRoomCost,
        dischargeCondition,
        finalDiagnosis,
        dischargeNotes,
        status: 'CHECKED_OUT',
        billingId: billing.id
      },
      include: {
        patient: true,
        room: true,
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        billing: true
      }
    });
    
    // Update room status
    const remainingOccupancies = await prisma.roomOccupancy.count({
      where: {
        roomId: occupancy.roomId,
        status: 'ACTIVE'
      }
    });
    
    if (remainingOccupancies === 0) {
      await prisma.room.update({
        where: { id: occupancy.roomId },
        data: { status: 'CLEANING' }
      });
    }
    
    res.json({
      success: true,
      data: {
        occupancy: updatedOccupancy,
        billing
      },
      message: 'Patient checked out successfully'
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while checking out patient'
    });
  }
};

// @desc    Get occupancy history
// @route   GET /api/inpatients/history
// @access  Private
const getOccupancyHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { patientId, startDate, endDate } = req.query;
    
    const where = {
      status: 'CHECKED_OUT'
    };
    
    if (patientId) {
      where.patientId = parseInt(patientId);
    }
    
    if (startDate && endDate) {
      where.checkedInAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const [history, total] = await Promise.all([
      prisma.roomOccupancy.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          checkedOutAt: 'desc'
        },
        include: {
          patient: {
            select: {
              id: true,
              medicalRecordNo: true,
              name: true
            }
          },
          room: {
            select: {
              roomNumber: true,
              roomType: true,
              pricePerDay: true
            }
          },
          doctor: {
            select: {
              name: true
            }
          },
          billing: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }),
      prisma.roomOccupancy.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching history'
    });
  }
};

// @desc    Export inpatient history to Excel
// @route   GET /api/inpatients/history/export
// @access  Private
const exportHistoryExcel = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.query;

    const where = {
      status: 'CHECKED_OUT',
      checkedOutAt: { not: null }
    };

    if (startDate && endDate) {
      where.checkedOutAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    const history = await prisma.roomOccupancy.findMany({
      where,
      include: {
        patient: true,
        room: true,
        doctor: {
          select: {
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        checkedOutAt: 'desc'
      }
    });

    // Calculate actual days for each occupancy
    const historyWithDays = history.map(occ => {
      const actualDays = calculateDays(occ.checkedInAt, occ.checkedOutAt);
      return { ...occ, actualDays };
    });

    // Transform data for Excel
    const excelData = historyWithDays.map((record, index) => {
      const dischargeConditionMap = {
        SEMBUH: 'Sembuh',
        MEMBAIK: 'Membaik',
        RUJUK: 'Dirujuk',
        MENINGGAL: 'Meninggal',
        APS: 'Atas Permintaan Sendiri'
      };

      const roomTypeMap = {
        VIP: 'VIP',
        KELAS_1: 'Kelas 1',
        KELAS_2: 'Kelas 2',
        KELAS_3: 'Kelas 3',
        ICU: 'ICU',
        NICU: 'NICU',
        PICU: 'PICU',
        ISOLATION: 'Isolasi'
      };

      return {
        'No': index + 1,
        'No. Registrasi': record.registrationNumber,
        'No. Rekam Medis': record.patient.medicalRecordNo,
        'Nama Pasien': record.patient.name,
        'Jenis Kelamin': record.patient.gender === 'MALE' ? 'Laki-laki' : 
                         record.patient.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya',
        'No. Kamar': record.room.roomNumber,
        'Tipe Kamar': roomTypeMap[record.room.roomType] || record.room.roomType,
        'No. Tempat Tidur': record.bedNumber || '-',
        'Dokter': record.doctor?.name || '-',
        'Departemen': record.doctor?.department || '-',
        'Diagnosa Awal': record.initialDiagnosis || '-',
        'Diagnosa Akhir': record.finalDiagnosis || '-',
        'Tanggal Check-in': new Date(record.checkedInAt).toLocaleDateString('id-ID'),
        'Jam Check-in': new Date(record.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        'Tanggal Check-out': new Date(record.checkedOutAt).toLocaleDateString('id-ID'),
        'Jam Check-out': new Date(record.checkedOutAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        'Lama Rawat (Hari)': record.actualDays,
        'Kondisi Pasien': dischargeConditionMap[record.dischargeCondition] || record.dischargeCondition,
        'Catatan Keluar': record.dischargeNotes || '-',
        'Harga/Hari': new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(record.room.pricePerDay),
        'Total Biaya Kamar': new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(record.room.pricePerDay * record.actualDays)
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 20 }, // No. Registrasi
      { wch: 18 }, // No. Rekam Medis
      { wch: 25 }, // Nama Pasien
      { wch: 15 }, // Jenis Kelamin
      { wch: 12 }, // No. Kamar
      { wch: 15 }, // Tipe Kamar
      { wch: 15 }, // Tempat Tidur
      { wch: 25 }, // Dokter
      { wch: 20 }, // Departemen
      { wch: 30 }, // Diagnosa Awal
      { wch: 30 }, // Diagnosa Akhir
      { wch: 18 }, // Tgl Check-in
      { wch: 12 }, // Jam Check-in
      { wch: 18 }, // Tgl Check-out
      { wch: 12 }, // Jam Check-out
      { wch: 15 }, // Lama Rawat
      { wch: 20 }, // Kondisi Pasien
      { wch: 35 }, // Catatan Keluar
      { wch: 18 }, // Harga/Hari
      { wch: 20 }  // Total Biaya
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Rawat Inap');

    // Generate filename with date range
    const dateRange = startDate && endDate
      ? `_${new Date(startDate).toISOString().split('T')[0]}_sd_${new Date(endDate).toISOString().split('T')[0]}`
      : `_${new Date().toISOString().split('T')[0]}`;
    const filename = `Riwayat_Rawat_Inap${dateRange}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting history'
    });
  }
};

// @desc    Update inpatient status (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
// @route   PATCH /api/inpatients/:id/status
// @access  Private (Admin, Nurse, Front Desk)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE', 'CHECKED_OUT', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const occupancy = await prisma.roomOccupancy.findUnique({
      where: { id: parseInt(id) },
      include: { room: true }
    });

    if (!occupancy) {
      return res.status(404).json({
        success: false,
        error: 'Occupancy not found'
      });
    }

    const oldStatus = occupancy.status;
    const updateData = { status };
    if (notes !== undefined) updateData.notes = notes;

    if ((status === 'CHECKED_IN' || status === 'ACTIVE') && oldStatus !== 'CHECKED_IN' && oldStatus !== 'ACTIVE') {
      updateData.checkedInAt = new Date();
      await prisma.room.update({
        where: { id: occupancy.roomId },
        data: { status: 'OCCUPIED' }
      });
    } else if (status === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
      await prisma.room.update({
        where: { id: occupancy.roomId },
        data: { status: 'RESERVED' }
      });
    } else if (status === 'CHECKED_OUT' && oldStatus !== 'CHECKED_OUT') {
      updateData.checkedOutAt = new Date();
      const actualDays = calculateDays(occupancy.checkedInAt || new Date(), new Date());
      updateData.actualDays = actualDays;
      updateData.totalRoomCost = actualDays * parseFloat(occupancy.room.pricePerDay || 0);

      await prisma.room.update({
        where: { id: occupancy.roomId },
        data: { status: 'CLEANING' }
      });
    } else if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      await prisma.room.update({
        where: { id: occupancy.roomId },
        data: { status: 'AVAILABLE' }
      });
    }

    const updated = await prisma.roomOccupancy.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true,
        room: true,
        doctor: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { occupancy: updated },
      message: `Status updated to ${status}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating status'
    });
  }
};

// @desc    Delete inpatient occupancy record
// @route   DELETE /api/inpatients/:id
// @access  Private (Admin, Nurse, Front Desk)
const deleteInpatient = async (req, res) => {
  try {
    const { id } = req.params;

    const occupancy = await prisma.roomOccupancy.findUnique({
      where: { id: parseInt(id) }
    });

    if (!occupancy) {
      return res.status(404).json({
        success: false,
        error: 'Inpatient record not found'
      });
    }

    const roomId = occupancy.roomId;
    const oldStatus = occupancy.status;

    // Delete occupancy
    await prisma.roomOccupancy.delete({
      where: { id: parseInt(id) }
    });

    // Check if room has remaining active/pending occupancies
    if (['CHECKED_IN', 'ACTIVE', 'CONFIRMED', 'PENDING'].includes(oldStatus)) {
      const remainingOccupancies = await prisma.roomOccupancy.count({
        where: {
          roomId: roomId,
          status: { in: ['CHECKED_IN', 'ACTIVE', 'CONFIRMED', 'PENDING'] }
        }
      });

      if (remainingOccupancies === 0) {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    res.json({
      success: true,
      message: 'Inpatient record deleted successfully'
    });
  } catch (error) {
    console.error('Delete inpatient error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting inpatient record'
    });
  }
};

module.exports = {
  getInpatients,
  getInpatient,
  checkInPatient,
  updateOccupancy,
  updateStatus,
  deleteInpatient,
  checkOutPatient,
  getOccupancyHistory,
  exportHistoryExcel
};
