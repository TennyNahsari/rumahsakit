const { validationResult } = require('express-validator');
const prisma = require('../database/prisma');
const XLSX = require('xlsx');

// Helper to get doctor queue prefix letter (A, B, C, D, E...) based on doctor ID
const getDoctorPrefixLetter = async (doctorId) => {
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR', isActive: true },
    orderBy: { id: 'asc' },
    select: { id: true }
  });
  const index = doctors.findIndex(d => d.id === parseInt(doctorId));
  if (index === -1) return 'A';
  
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  const firstLetter = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const secondLetter = String.fromCharCode(65 + (index % 26));
  return `${firstLetter}${secondLetter}`;
};

// Helper to generate formatted queue number per doctor, channel & visit type
const generateDoctorQueueNumber = async (doctorId, visitType, channel) => {
  const prefixLetter = await getDoctorPrefixLetter(doctorId);
  
  let queuePrefix = prefixLetter;
  if (visitType === 'EMERGENCY') {
    queuePrefix = `${prefixLetter}-IGD`;
  } else if (visitType === 'MEDICAL_ACTION') {
    queuePrefix = `${prefixLetter}-TND`;
  } else if (visitType === 'INPATIENT') {
    queuePrefix = `${prefixLetter}-RWI`;
  } else if (channel === 'ONLINE_WEBSITE') {
    queuePrefix = `WEB-${prefixLetter}`;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await prisma.visit.count({
    where: {
      doctorId: parseInt(doctorId),
      queuePrefix: queuePrefix,
      createdAt: { gte: todayStart }
    }
  });

  const seq = count + 1;
  const queueNumberFormatted = `${queuePrefix}-${seq}`;

  return {
    queuePrefix,
    queueNumberFormatted
  };
};

// @desc    Get all visits
// @route   GET /api/visits
// @access  Private
const getVisits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const { patientId, doctorId, status, channel } = req.query;

    const where = {};
    if (patientId) where.patientId = parseInt(patientId);
    if (doctorId) where.doctorId = parseInt(doctorId);
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
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
              phone: true,
              gender: true
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
      prisma.visit.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        visits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching visits'
    });
  }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Private
const getVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
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
        medicalRecords: true,
        billings: true
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    res.json({
      success: true,
      data: visit
    });

  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching visit'
    });
  }
};

// @desc    Create new visit (Staff / Front Desk)
// @route   POST /api/visits
// @access  Private (Admin, Front Desk, Doctor)
const createVisit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { patientId, doctorId, visitType, channel, scheduledAt, notes } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: parseInt(doctorId) }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const selectedChannel = channel || 'ONSITE_LOKET';
    const { queuePrefix, queueNumberFormatted } = await generateDoctorQueueNumber(doctorId, visitType, selectedChannel);

    const visit = await prisma.visit.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        visitType: visitType || 'OUTPATIENT',
        channel: selectedChannel,
        queuePrefix,
        queueNumberFormatted,
        queueNumber: queueNumberFormatted,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        status: 'SCHEDULED',
        notes
      },
      include: {
        patient: {
          select: {
            id: true,
            medicalRecordNo: true,
            name: true,
            phone: true
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
      data: visit
    });

  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating visit'
    });
  }
};

// @desc    Update visit
// @route   PUT /api/visits/:id
// @access  Private (Admin, Front Desk, Doctor)
const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitType, scheduledAt, status, notes } = req.body;

    const existingVisit = await prisma.visit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingVisit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    const updateData = {};
    if (visitType) updateData.visitType = visitType;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (status === 'CALLED' && !existingVisit.calledAt) {
      updateData.calledAt = new Date();
    }

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json({
      success: true,
      data: visit
    });

  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating visit'
    });
  }
};

// @desc    Call visit / queue number (Panggil Antrean)
// @route   POST /api/visits/:id/call
// @access  Private (Admin, Front Desk, Doctor)
const callVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CALLED',
        calledAt: new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            medicalRecordNo: true,
            name: true,
            phone: true
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
      message: `Antrean ${visit.queueNumberFormatted} dipanggil`,
      data: visit
    });
  } catch (error) {
    console.error('Call visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to call visit'
    });
  }
};

// @desc    Start visit / examination (Mulai Periksa)
// @route   POST /api/visits/:id/start
// @access  Private (Admin, Doctor)
const startVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        status: 'IN_PROGRESS'
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    console.error('Start visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start visit'
    });
  }
};

// @desc    Complete visit (Selesai & Auto Advance Next Queue)
// @route   POST /api/visits/:id/complete
// @access  Private (Admin, Doctor)
const completeVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const completedVisit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        status: 'COMPLETED'
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    // Find next waiting queue for this doctor
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const nextVisit = await prisma.visit.findFirst({
      where: {
        doctorId: completedVisit.doctorId,
        status: 'SCHEDULED',
        createdAt: { gte: todayStart }
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        patient: {
          select: {
            id: true,
            medicalRecordNo: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Pemeriksaan selesai',
      data: {
        completedVisit,
        nextVisit: nextVisit || null
      }
    });
  } catch (error) {
    console.error('Complete visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete visit'
    });
  }
};

// @desc    Skip / No-Show visit (Lewati)
// @route   POST /api/visits/:id/skip
// @access  Private (Admin, Front Desk, Doctor)
const skipVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        status: 'SKIPPED'
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json({
      success: true,
      message: `Antrean ${visit.queueNumberFormatted} dilewati`,
      data: visit
    });
  } catch (error) {
    console.error('Skip visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to skip visit'
    });
  }
};

// @desc    Get real-time TV Queue Display data
// @route   GET /api/visits/queue-display
// @access  Public
const getQueueDisplay = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayDateFilter = {
      OR: [
        { scheduledAt: { gte: todayStart, lte: todayEnd } },
        { createdAt: { gte: todayStart, lte: todayEnd } }
      ]
    };

    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, department: true }
    });

    const displayData = await Promise.all(doctors.map(async (doctor, idx) => {
      const prefixLetter = String.fromCharCode(65 + (idx % 26));

      const currentServing = await prisma.visit.findFirst({
        where: {
          doctorId: doctor.id,
          status: { in: ['CALLED', 'IN_PROGRESS'] },
          ...todayDateFilter
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          patient: {
            select: { name: true, medicalRecordNo: true }
          }
        }
      });

      const nextQueue = await prisma.visit.findFirst({
        where: {
          doctorId: doctor.id,
          status: 'SCHEDULED',
          ...todayDateFilter
        },
        orderBy: { createdAt: 'asc' },
        include: {
          patient: {
            select: { name: true, medicalRecordNo: true }
          }
        }
      });

      const waitingCount = await prisma.visit.count({
        where: {
          doctorId: doctor.id,
          status: 'SCHEDULED',
          ...todayDateFilter
        }
      });

      return {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          department: doctor.department || 'Poliklinik Spesialis',
          prefixLetter
        },
        nowServing: currentServing ? {
          id: currentServing.id,
          queueNumberFormatted: currentServing.queueNumberFormatted || currentServing.queueNumber,
          patientName: currentServing.patient.name,
          visitType: currentServing.visitType,
          channel: currentServing.channel,
          status: currentServing.status,
          calledAt: currentServing.calledAt
        } : null,
        nextQueue: nextQueue ? {
          id: nextQueue.id,
          queueNumberFormatted: nextQueue.queueNumberFormatted || nextQueue.queueNumber,
          patientName: nextQueue.patient.name,
          visitType: nextQueue.visitType,
          channel: nextQueue.channel
        } : null,
        waitingCount
      };
    }));

    res.json({
      success: true,
      data: displayData
    });

  } catch (error) {
    console.error('Queue display error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue display'
    });
  }
};

// @desc    Create public booking appointment from Landing Page
// @route   POST /api/visits/public-booking
// @access  Public
const createPublicBooking = async (req, res) => {
  try {
    const { patientName, phone, poly, doctor: doctorName, date, paymentType, complaint } = req.body;

    if (!patientName || !phone || !date) {
      return res.status(400).json({
        success: false,
        error: 'Patient name, phone, and date are required'
      });
    }

    let patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone: phone.trim() },
          { name: patientName.trim() }
        ]
      }
    });

    if (!patient) {
      const count = await prisma.patient.count();
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const mrn = `RM-${currentYear}${currentMonth}-${String(count + 1).padStart(4, '0')}`;

      patient = await prisma.patient.create({
        data: {
          medicalRecordNo: mrn,
          name: patientName.trim(),
          phone: phone.trim(),
          gender: 'OTHER',
          dateOfBirth: new Date('1990-01-01'),
          address: 'Pendaftaran Online Landing Page'
        }
      });
    }

    let doctorUser = null;
    if (doctorName) {
      doctorUser = await prisma.user.findFirst({
        where: {
          name: { contains: doctorName.split(',')[0].trim(), mode: 'insensitive' },
          role: 'DOCTOR'
        }
      });
    }

    if (!doctorUser) {
      doctorUser = await prisma.user.findFirst({
        where: { role: 'DOCTOR', isActive: true }
      });
    }

    if (!doctorUser) {
      doctorUser = await prisma.user.findFirst({
        where: { isActive: true }
      });
    }

    const { queuePrefix, queueNumberFormatted } = await generateDoctorQueueNumber(doctorUser.id, 'OUTPATIENT', 'ONLINE_WEBSITE');

    const scheduleDate = new Date(date);

    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId: doctorUser.id,
        visitType: 'OUTPATIENT',
        channel: 'ONLINE_WEBSITE',
        queuePrefix,
        queueNumberFormatted,
        queueNumber: queueNumberFormatted,
        scheduledAt: scheduleDate,
        status: 'SCHEDULED',
        notes: `Online Booking Landing Page | Poli: ${poly || '-'} | Penjamin: ${paymentType || 'BPJS'} | Keluhan: ${complaint || '-'}`
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pendaftaran janji dokter online berhasil',
      data: {
        bookingCode: `MEDI-${queueNumberFormatted}`,
        queueNumberFormatted,
        visit
      }
    });
  } catch (error) {
    console.error('Public booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal melakukan pendaftaran online'
    });
  }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Private (Admin)
const deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    await prisma.visit.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Visit deleted successfully'
    });

  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting visit'
    });
  }
};

// @desc    Export visits to Excel
// @route   GET /api/visits/export/excel
// @access  Private
const exportVisitsExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      const dateCondition = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateCondition.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateCondition.lte = end;
      }
      where.scheduledAt = dateCondition;
    }

    const visits = await prisma.visit.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        patient: true,
        doctor: true
      }
    });

    const excelData = visits.map((visit, index) => {
      const channelLabel = visit.channel === 'ONLINE_WEBSITE' ? 'WEB PASIEN (Online)' : 'LOKET ADMISI (Onsite)';
      
      const typeLabels = {
        GENERAL_CHECKUP: 'Pemeriksaan Umum',
        OUTPATIENT: 'Rawat Jalan (Poliklinik)',
        INPATIENT: 'Rawat Inap',
        EMERGENCY: 'IGD (Gawat Darurat)',
        MEDICAL_ACTION: 'Tindakan Medis'
      };
      const visitTypeLabel = typeLabels[visit.visitType] || visit.visitType;

      const statusLabels = {
        SCHEDULED: 'Menunggu',
        CALLED: 'Dipanggil',
        IN_PROGRESS: 'Sedang Diperiksa',
        COMPLETED: 'Selesai',
        SKIPPED: 'Dilewati',
        CANCELLED: 'Dibatalkan (Cancel)',
        NO_SHOW: 'Tidak Hadir'
      };
      const statusLabel = statusLabels[visit.status] || visit.status;

      let dateFormatted = '-';
      if (visit.scheduledAt) {
        const d = new Date(visit.scheduledAt);
        const dateStr = d.toLocaleDateString('id-ID');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        dateFormatted = (hours !== '00' || minutes !== '00') ? `${dateStr} ${hours}:${minutes}` : dateStr;
      }

      return {
        No: index + 1,
        'No. Antrean': visit.queueNumberFormatted || visit.queueNumber || '-',
        'Saluran Pendaftaran': channelLabel,
        'No. Rekam Medis (RM)': visit.patient?.medicalRecordNo || '-',
        'Nama Pasien': visit.patient?.name || '-',
        'Dokter DPJP': visit.doctor?.name || '-',
        'Spesialisasi / Poliklinik': visit.doctor?.department || 'Poliklinik',
        'Tipe Kunjungan': visit.visitTypeLabel || visitTypeLabel,
        'Status Antrean': statusLabel,
        'Tanggal & Waktu Kunjungan': dateFormatted,
        'Waktu Dipanggil': visit.calledAt ? new Date(visit.calledAt).toLocaleString('id-ID') : '-',
        'Catatan / Keluhan': visit.notes || '-'
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data Kunjungan');

    const filename = `Data_Kunjungan_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting visits'
    });
  }
};

// @desc    Bulk auto-complete remaining active visits for the day
// @route   POST /api/visits/auto-complete-day
// @access  Private (ADMIN, FRONT_DESK)
const autoCompleteDayVisits = async (req, res) => {
  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await prisma.visit.updateMany({
      where: {
        status: { in: ['SCHEDULED', 'CALLED', 'IN_PROGRESS'] },
        OR: [
          { scheduledAt: { lte: todayEnd } },
          { createdAt: { lte: todayEnd } }
        ],
        AND: [
          {
            // Do not cancel future scheduled appointments
            NOT: {
              scheduledAt: { gt: todayEnd }
            }
          }
        ]
      },
      data: {
        status: 'CANCELLED'
      }
    });

    res.json({
      success: true,
      message: `${result.count} antrean belum terlayani berhasil dibatalkan (CANCELLED)`,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Auto complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while closing day visits'
    });
  }
};

module.exports = {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  exportVisitsExcel,
  callVisit,
  startVisit,
  completeVisit,
  skipVisit,
  getQueueDisplay,
  createPublicBooking,
  autoCompleteDayVisits
};
