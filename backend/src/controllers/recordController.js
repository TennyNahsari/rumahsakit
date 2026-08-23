const { validationResult } = require('express-validator');
const prisma = require('../database/prisma');
const XLSX = require('xlsx');

// @desc    Get all medical records
// @route   GET /api/records
// @access  Private
const getRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { patientId, patientName, search, startDate, endDate } = req.query;

    const where = {};

    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    const searchQuery = patientName || search;
    if (searchQuery) {
      where.patient = {
        name: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.createdAt.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.createdAt.lte = e;
      }
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          patient: {
            select: {
              id: true,
              medicalRecordNo: true,
              name: true,
              dateOfBirth: true,
              gender: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              department: true
            }
          },
          visit: {
            select: {
              id: true,
              visitType: true,
              scheduledAt: true,
              status: true
            }
          }
        }
      }),
      prisma.medicalRecord.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching medical records'
    });
  }
};

// @desc    Get single medical record
// @route   GET /api/records/:id
// @access  Private
const getRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: {
          select: {
            id: true,
            medicalRecordNo: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            address: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true
          }
        },
        visit: {
          select: {
            id: true,
            visitType: true,
            scheduledAt: true,
            status: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      data: { record }
    });

  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching medical record'
    });
  }
};

// @desc    Create new medical record
// @route   POST /api/records
// @access  Private
const createRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { visitId, patientId, doctorId, diagnosisCode, symptoms, diagnosis, treatment, prescription, attachments } = req.body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: parseInt(doctorId) }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Prepare data object
    const recordData = {
      patientId: parseInt(patientId),
      doctorId: parseInt(doctorId),
      diagnosisCode: diagnosisCode || null,
      symptoms: symptoms || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      prescription: prescription || null,
      attachments: attachments || null
    };

    // Only add visitId if provided
    if (visitId) {
      recordData.visitId = parseInt(visitId);
    }

    const record = await prisma.medicalRecord.create({
      data: recordData,
      include: {
        patient: {
          select: {
            id: true,
            medicalRecordNo: true,
            name: true
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
    });

    res.status(201).json({
      success: true,
      data: { record },
      message: 'Medical record created successfully'
    });

  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating medical record'
    });
  }
};

// @desc    Update medical record
// @route   PUT /api/records/:id
// @access  Private
const updateRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { diagnosisCode, symptoms, diagnosis, treatment, prescription, attachments } = req.body;

    // Check if record exists
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found'
      });
    }

    const record = await prisma.medicalRecord.update({
      where: { id: parseInt(id) },
      data: {
        diagnosisCode,
        symptoms,
        diagnosis,
        treatment,
        prescription,
        attachments
      },
      include: {
        patient: {
          select: {
            id: true,
            medicalRecordNo: true,
            name: true
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
    });

    res.json({
      success: true,
      data: { record },
      message: 'Medical record updated successfully'
    });

  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating medical record'
    });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/records/:id
// @access  Private
const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found'
      });
    }

    await prisma.medicalRecord.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting medical record'
    });
  }
};

// @desc    Export medical records to Excel
// @route   GET /api/records/export/excel
// @access  Private
const exportRecordsExcel = async (req, res) => {
  try {
    const { patientId, patientName, search, startDate, endDate } = req.query;

    // Build where clause for filtering
    const where = {};
    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    const searchQuery = patientName || search;
    if (searchQuery) {
      where.patient = {
        name: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.createdAt.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.createdAt.lte = e;
      }
    }

    // Fetch all records with filters
    const records = await prisma.medicalRecord.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        patient: {
          select: {
            medicalRecordNo: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            phone: true
          }
        },
        doctor: {
          select: {
            name: true,
            department: true
          }
        },
        visit: {
          select: {
            visitType: true,
            scheduledAt: true
          }
        }
      }
    });

    // Transform data for Excel
    const excelData = records.map((record, index) => {
      const age = Math.floor((new Date() - new Date(record.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      
      return {
        'No': index + 1,
        'No. Rekam Medis': record.patient.medicalRecordNo,
        'Nama Pasien': record.patient.name,
        'Umur': age + ' tahun',
        'Jenis Kelamin': record.patient.gender === 'MALE' ? 'Laki-laki' : record.patient.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya',
        'No. Telepon': record.patient.phone || '-',
        'Nama Dokter': record.doctor.name,
        'Departemen': record.doctor.department || '-',
        'Kode Diagnosis': record.diagnosisCode || '-',
        'Diagnosis': record.diagnosis || '-',
        'Keluhan': record.symptoms || '-',
        'Pengobatan': record.treatment || '-',
        'Jenis Kunjungan': record.visit ? (
          record.visit.visitType === 'OUTPATIENT' ? 'Rawat Jalan' : 
          record.visit.visitType === 'INPATIENT' ? 'Rawat Inap' : 
          record.visit.visitType === 'EMERGENCY' ? 'Darurat' : record.visit.visitType
        ) : '-',
        'Tanggal Kunjungan': record.visit ? new Date(record.visit.scheduledAt).toLocaleDateString('id-ID') : '-',
        'Tanggal Pembuatan': new Date(record.createdAt).toLocaleDateString('id-ID'),
        'Jam': new Date(record.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 20 }, // No. Rekam Medis
      { wch: 25 }, // Nama Pasien
      { wch: 12 }, // Umur
      { wch: 15 }, // Jenis Kelamin
      { wch: 15 }, // Telepon
      { wch: 25 }, // Nama Dokter
      { wch: 20 }, // Departemen
      { wch: 15 }, // Kode Diagnosis
      { wch: 30 }, // Diagnosis
      { wch: 40 }, // Keluhan
      { wch: 40 }, // Pengobatan
      { wch: 15 }, // Jenis Kunjungan
      { wch: 18 }, // Tanggal Kunjungan
      { wch: 18 }, // Tanggal Pembuatan
      { wch: 10 }  // Jam
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Rekam Medis');

    // Generate buffer
    const dateRange = startDate && endDate 
      ? `_${new Date(startDate).toISOString().split('T')[0]}_sd_${new Date(endDate).toISOString().split('T')[0]}`
      : `_${new Date().toISOString().split('T')[0]}`;
    const filename = `Rekam_Medis${dateRange}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting medical records'
    });
  }
};

module.exports = {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  exportRecordsExcel
};
