const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// Get all billings with pagination and filters
const getBillings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status,
      patientId,
      startDate,
      endDate 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (patientId) {
      where.patientId = parseInt(patientId);
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [billings, total] = await Promise.all([
      prisma.billing.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              medicalRecordNo: true,
              phone: true
            }
          },
          visit: {
            select: {
              id: true,
              visitType: true,
              scheduledAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.billing.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        billings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get billings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch billings' 
    });
  }
};

// Get single billing by ID
const getBilling = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await prisma.billing.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalRecordNo: true,
            phone: true,
            address: true
          }
        },
        visit: {
          select: {
            id: true,
            visitType: true,
            scheduledAt: true,
            doctor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Billing not found' 
      });
    }

    res.json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    console.error('Get billing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch billing' 
    });
  }
};

// Create new billing
const createBilling = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { patientId, visitId, items, subtotal, tax, discount, total } = req.body;

    // Deduct medicine stock from batches if items contain medicineId and qty
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.medicineId && item.qty && parseInt(item.qty) > 0) {
          const medId = parseInt(item.medicineId);
          let remainingToDeduct = parseInt(item.qty);

          const batches = await prisma.medicineBatch.findMany({
            where: { medicineId: medId, stock: { gt: 0 } },
            orderBy: { expiryDate: 'asc' }
          });

          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;

            const deductAmount = Math.min(batch.stock, remainingToDeduct);
            await prisma.medicineBatch.update({
              where: { id: batch.id },
              data: { stock: batch.stock - deductAmount }
            });

            remainingToDeduct -= deductAmount;
          }
        }
      }
    }

    const billing = await prisma.billing.create({
      data: {
        patientId: parseInt(patientId),
        visitId: visitId ? parseInt(visitId) : null,
        items,
        subtotal: parseFloat(subtotal),
        tax: tax ? parseFloat(tax) : 0,
        discount: discount ? parseFloat(discount) : 0,
        total: parseFloat(total),
        status: 'UNPAID'
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalRecordNo: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    console.error('Create billing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create billing' 
    });
  }
};

// Update billing
const updateBilling = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { items, subtotal, tax, discount, total, status } = req.body;

    const existingBilling = await prisma.billing.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBilling) {
      return res.status(404).json({ 
        success: false, 
        error: 'Billing not found' 
      });
    }

    const updateData = {};
    if (items !== undefined) {
      updateData.items = items;
      // Deduct medicine stock if items contain medicineId & qty
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.medicineId && item.qty && parseInt(item.qty) > 0) {
            const medId = parseInt(item.medicineId);
            let remainingToDeduct = parseInt(item.qty);

            const batches = await prisma.medicineBatch.findMany({
              where: { medicineId: medId, stock: { gt: 0 } },
              orderBy: { expiryDate: 'asc' }
            });

            for (const batch of batches) {
              if (remainingToDeduct <= 0) break;

              const deductAmount = Math.min(batch.stock, remainingToDeduct);
              await prisma.medicineBatch.update({
                where: { id: batch.id },
                data: { stock: batch.stock - deductAmount }
              });

              remainingToDeduct -= deductAmount;
            }
          }
        }
      }
    }
    if (subtotal !== undefined) updateData.subtotal = parseFloat(subtotal);
    if (tax !== undefined) updateData.tax = parseFloat(tax);
    if (discount !== undefined) updateData.discount = parseFloat(discount);
    if (total !== undefined) updateData.total = parseFloat(total);
    if (status !== undefined) {
      updateData.status = status;
      // Set paidAt when billing is marked as PAID
      if (status === 'PAID' && existingBilling.status !== 'PAID') {
        updateData.paidAt = new Date();
      }
      // Clear paidAt if status changed from PAID to something else
      if (status !== 'PAID' && existingBilling.status === 'PAID') {
        updateData.paidAt = null;
      }
    }

    const billing = await prisma.billing.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalRecordNo: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    console.error('Update billing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update billing' 
    });
  }
};

// Record payment (mark as paid)
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;

    const billing = await prisma.billing.findUnique({
      where: { id: parseInt(id) }
    });

    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Billing not found' 
      });
    }

    if (billing.status === 'PAID') {
      return res.status(400).json({ 
        success: false, 
        error: 'Billing already paid' 
      });
    }

    const amount = parseFloat(amountPaid);
    const total = parseFloat(billing.total);

    let newStatus = 'UNPAID';
    if (amount >= total) {
      newStatus = 'PAID';
    } else if (amount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const updatedBilling = await prisma.billing.update({
      where: { id: parseInt(id) },
      data: {
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalRecordNo: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { billing: updatedBilling }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record payment' 
    });
  }
};

// Delete billing
const deleteBilling = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await prisma.billing.findUnique({
      where: { id: parseInt(id) }
    });

    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Billing not found' 
      });
    }

    if (billing.status === 'PAID') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete paid billing' 
      });
    }

    await prisma.billing.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Billing deleted successfully'
    });
  } catch (error) {
    console.error('Delete billing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete billing' 
    });
  }
};

// Get billing statistics
const getBillingStats = async (req, res) => {
  try {
    const [
      totalBillings,
      paidBillings,
      unpaidBillings,
      partiallyPaidBillings,
      totalRevenue,
      pendingRevenue
    ] = await Promise.all([
      prisma.billing.count(),
      prisma.billing.count({ where: { status: 'PAID' } }),
      prisma.billing.count({ where: { status: 'UNPAID' } }),
      prisma.billing.count({ where: { status: 'PARTIALLY_PAID' } }),
      prisma.billing.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true }
      }),
      prisma.billing.aggregate({
        where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
        _sum: { total: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total: totalBillings,
          paid: paidBillings,
          unpaid: unpaidBillings,
          partiallyPaid: partiallyPaidBillings,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingRevenue: pendingRevenue._sum.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch billing statistics' 
    });
  }
};

// @desc    Export billings to Excel
// @route   GET /api/billing/export/excel
// @access  Private
const exportBillingsExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause for date filtering
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch all billings with filters
    const billings = await prisma.billing.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        patient: {
          select: {
            medicalRecordNo: true,
            name: true,
            phone: true,
            gender: true
          }
        },
        visit: {
          select: {
            visitType: true,
            scheduledAt: true,
            doctor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Transform data for Excel
    const excelData = billings.map((billing, index) => {
      return {
        'No': index + 1,
        'No. Rekam Medis': billing.patient.medicalRecordNo,
        'Nama Pasien': billing.patient.name,
        'Jenis Kelamin': billing.patient.gender === 'MALE' ? 'Laki-laki' : billing.patient.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya',
        'No. Telepon': billing.patient.phone || '-',
        'Dokter': billing.visit?.doctor?.name || '-',
        'Jenis Kunjungan': billing.visit ? (
          billing.visit.visitType === 'OUTPATIENT' ? 'Rawat Jalan' : 
          billing.visit.visitType === 'INPATIENT' ? 'Rawat Inap' : 
          billing.visit.visitType === 'EMERGENCY' ? 'Darurat' : billing.visit.visitType
        ) : '-',
        'Subtotal': new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(billing.subtotal),
        'Pajak': new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(billing.tax),
        'Diskon': new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(billing.discount),
        'Total': new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(billing.total),
        'Status': billing.status === 'PAID' ? 'Lunas' :
                  billing.status === 'UNPAID' ? 'Belum Bayar' :
                  billing.status === 'PARTIALLY_PAID' ? 'Dibayar Sebagian' :
                  billing.status === 'CANCELLED' ? 'Dibatalkan' : billing.status,
        'Tanggal Bayar': billing.paidAt ? new Date(billing.paidAt).toLocaleDateString('id-ID') : '-',
        'Tanggal Dibuat': new Date(billing.createdAt).toLocaleDateString('id-ID'),
        'Jam': new Date(billing.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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
      { wch: 15 }, // Jenis Kelamin
      { wch: 15 }, // Telepon
      { wch: 25 }, // Dokter
      { wch: 15 }, // Jenis Kunjungan
      { wch: 18 }, // Subtotal
      { wch: 18 }, // Pajak
      { wch: 18 }, // Diskon
      { wch: 18 }, // Total
      { wch: 18 }, // Status
      { wch: 18 }, // Tanggal Bayar
      { wch: 18 }, // Tanggal Dibuat
      { wch: 10 }  // Jam
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data Tagihan');

    // Generate buffer
    const dateRange = startDate && endDate 
      ? `_${new Date(startDate).toISOString().split('T')[0]}_sd_${new Date(endDate).toISOString().split('T')[0]}`
      : `_${new Date().toISOString().split('T')[0]}`;
    const filename = `Data_Tagihan${dateRange}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting billings'
    });
  }
};

module.exports = {
  getBillings,
  getBilling,
  createBilling,
  updateBilling,
  recordPayment,
  deleteBilling,
  getBillingStats,
  exportBillingsExcel
};
