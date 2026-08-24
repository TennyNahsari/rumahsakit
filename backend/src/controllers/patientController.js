const { validationResult } = require('express-validator');
const prisma = require('../database/prisma');
const XLSX = require('xlsx');

// Generate unique Medical Record Number
const generateMRN = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `MRN${year}${month}${day}`;
  
  // Find the last MRN for today
  const lastPatient = await prisma.patient.findFirst({
    where: {
      medicalRecordNo: {
        startsWith: prefix
      }
    },
    orderBy: {
      medicalRecordNo: 'desc'
    }
  });

  let sequence = 1;
  if (lastPatient) {
    const lastSequence = parseInt(lastPatient.medicalRecordNo.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const gender = req.query.gender || '';

    // Construct filtering clause
    const where = {};

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { medicalRecordNo: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (gender && ['MALE', 'FEMALE', 'OTHER'].includes(gender.toUpperCase())) {
      where.gender = gender.toUpperCase();
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          medicalRecordNo: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          address: true,
          createdAt: true,
          _count: {
            select: {
              visits: true
            }
          }
        }
      }),
      prisma.patient.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching patients'
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        visits: {
          take: 5,
          orderBy: {
            scheduledAt: 'desc'
          },
          include: {
            doctor: {
              select: {
                name: true,
                department: true
              }
            }
          }
        },
        _count: {
          select: {
            visits: true,
            medicalRecords: true,
            billings: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching patient'
    });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Admin, Front Desk, Doctor, Nurse)
const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      dateOfBirth,
      gender,
      phone,
      address,
      emergencyContact,
      emergencyContactName,
      emergencyContactRel,
      emergencyContactPhone,
      nik,
      bloodType,
      religion,
      maritalStatus,
      insuranceType,
      insuranceNumber,
      allergies,
      medicalHistory,
    } = req.body;

    // Generate unique MRN
    const medicalRecordNo = await generateMRN();

    const contactData = emergencyContact || {
      name: emergencyContactName || '',
      relationship: emergencyContactRel || '',
      phone: emergencyContactPhone || '',
      nik: nik || '',
      bloodType: bloodType || '',
      religion: religion || '',
      maritalStatus: maritalStatus || '',
      insuranceType: insuranceType || '',
      insuranceNumber: insuranceNumber || '',
      allergies: allergies || '',
      medicalHistory: medicalHistory || '',
    };

    const patient = await prisma.patient.create({
      data: {
        medicalRecordNo,
        name,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone,
        address,
        emergencyContact: contactData,
      }
    });

    res.status(201).json({
      success: true,
      data: { patient },
      message: 'Patient created successfully'
    });

  } catch (error) {
    console.error('createPatient error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Medical record number already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while creating patient'
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Admin, Front Desk, Doctor, Nurse)
const updatePatient = async (req, res) => {
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
    const {
      name,
      dateOfBirth,
      gender,
      phone,
      address,
      emergencyContact,
      emergencyContactName,
      emergencyContactRel,
      emergencyContactPhone,
      nik,
      bloodType,
      religion,
      maritalStatus,
      insuranceType,
      insuranceNumber,
      allergies,
      medicalHistory,
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) data.gender = gender;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;

    if (
      emergencyContact !== undefined ||
      emergencyContactName !== undefined ||
      emergencyContactPhone !== undefined ||
      nik !== undefined ||
      bloodType !== undefined ||
      allergies !== undefined
    ) {
      const existingPatient = await prisma.patient.findUnique({
        where: { id: parseInt(id) },
        select: { emergencyContact: true }
      });

      const existingContact = existingPatient?.emergencyContact || {};
      data.emergencyContact = {
        ...existingContact,
        ...(emergencyContact || {}),
        ...(emergencyContactName !== undefined && { name: emergencyContactName }),
        ...(emergencyContactRel !== undefined && { relationship: emergencyContactRel }),
        ...(emergencyContactPhone !== undefined && { phone: emergencyContactPhone }),
        ...(nik !== undefined && { nik }),
        ...(bloodType !== undefined && { bloodType }),
        ...(religion !== undefined && { religion }),
        ...(maritalStatus !== undefined && { maritalStatus }),
        ...(insuranceType !== undefined && { insuranceType }),
        ...(insuranceNumber !== undefined && { insuranceNumber }),
        ...(allergies !== undefined && { allergies }),
        ...(medicalHistory !== undefined && { medicalHistory }),
      };
    }

    const patient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      success: true,
      data: { patient },
      message: 'Patient updated successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while updating patient'
    });
  }
};

// @desc    Delete patient (soft delete)
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient has any visits or records
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            visits: true,
            medicalRecords: true,
            billings: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    if (patient._count.visits > 0 || patient._count.medicalRecords > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete patient with existing visits or medical records'
      });
    }

    await prisma.patient.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting patient'
    });
  }
};

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private
const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q,
              mode: 'insensitive'
            }
          },
          {
            medicalRecordNo: {
              contains: q,
              mode: 'insensitive'
            }
          },
          {
            phone: {
              contains: q,
              mode: 'insensitive'
            }
          }
        ]
      },
      take: 20,
      select: {
        id: true,
        medicalRecordNo: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        phone: true
      }
    });

    res.json({
      success: true,
      data: { patients }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while searching patients'
    });
  }
};

// @desc    Export all patients to Excel
// @route   GET /api/patients/export/excel
// @access  Private
const exportPatientsExcel = async (req, res) => {
  try {
    // Fetch all patients without pagination
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        visits: {
          select: {
            id: true
          }
        }
      }
    });

    // Transform data for Excel
    const excelData = patients.map((patient, index) => {
      const age = Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      
      return {
        'No': index + 1,
        'No. Rekam Medis': patient.medicalRecordNo,
        'Nama Lengkap': patient.name,
        'Tanggal Lahir': new Date(patient.dateOfBirth).toLocaleDateString('id-ID'),
        'Umur': age + ' tahun',
        'Jenis Kelamin': patient.gender === 'MALE' ? 'Laki-laki' : patient.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya',
        'No. Telepon': patient.phone || '-',
        'Alamat': patient.address || '-',
        'Kontak Darurat': patient.emergencyContact ? JSON.stringify(patient.emergencyContact) : '-',
        'Jumlah Kunjungan': patient.visits.length,
        'Tanggal Registrasi': new Date(patient.createdAt).toLocaleDateString('id-ID')
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 20 }, // No. Rekam Medis
      { wch: 25 }, // Nama
      { wch: 15 }, // Tanggal Lahir
      { wch: 12 }, // Umur
      { wch: 15 }, // Jenis Kelamin
      { wch: 15 }, // Telepon
      { wch: 40 }, // Alamat
      { wch: 30 }, // Kontak Darurat
      { wch: 15 }, // Jumlah Kunjungan
      { wch: 18 }  // Tanggal Registrasi
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pasien');

    // Generate buffer
    const filename = `Data_Pasien_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting patients'
    });
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  exportPatientsExcel
};