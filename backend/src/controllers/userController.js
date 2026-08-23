const { validationResult } = require('express-validator');
const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

// @desc    Get active doctors for public display
// @route   GET /api/users/public/doctors
// @access  Public
const getPublicDoctors = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        isActive: true
      },
      orderBy: {
        id: 'asc'
      },
      select: {
        id: true,
        name: true,
        department: true,
        email: true,
        phone: true,
        avatarUrl: true
      }
    });

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    console.error('Get public doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public doctors'
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count()
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user'
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, role, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        department,
        phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only or own profile)
const updateUser = async (req, res) => {
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
    const { email, name, role, department, phone, isActive, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    const updateData = {
      email,
      name,
      role,
      department,
      phone,
      isActive
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user },
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
};

// @desc    Export users to Excel
// @route   GET /api/users/export/excel
// @access  Private (Admin)
const exportUsersExcel = async (req, res) => {
  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform data for Excel
    const excelData = users.map((user, index) => {
      const roleLabels = {
        ADMIN: 'Administrator',
        DOCTOR: 'Dokter',
        NURSE: 'Perawat',
        FRONT_DESK: 'Front Desk',
        PHARMACY: 'Farmasi',
        LABORATORY: 'Laboratorium',
        PATIENT: 'Pasien'
      };

      return {
        'No': index + 1,
        'Nama': user.name,
        'Email': user.email,
        'Role': roleLabels[user.role] || user.role,
        'Departemen': user.department || '-',
        'No. Telepon': user.phone || '-',
        'Status': user.isActive ? 'Aktif' : 'Nonaktif',
        'Tanggal Dibuat': new Date(user.createdAt).toLocaleDateString('id-ID'),
        'Terakhir Update': new Date(user.updatedAt).toLocaleDateString('id-ID')
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama
      { wch: 30 }, // Email
      { wch: 15 }, // Role
      { wch: 25 }, // Departemen
      { wch: 15 }, // Telepon
      { wch: 10 }, // Status
      { wch: 18 }, // Tanggal Dibuat
      { wch: 18 }  // Terakhir Update
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pengguna');

    // Generate buffer
    const filename = `Data_Pengguna_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting users'
    });
  }
};

module.exports = {
  getPublicDoctors,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  exportUsersExcel
};
