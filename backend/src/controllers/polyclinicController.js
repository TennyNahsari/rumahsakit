const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to map department string to full polyclinic metadata preset
const mapDeptToPolyPreset = (dept = '') => {
  const lower = dept.toLowerCase();
  if (lower.includes('penyakit dalam') || lower.includes('dalam')) {
    return {
      name: 'Poliklinik Penyakit Dalam',
      englishName: 'Internal Medicine Clinic',
      code: 'POLI-INT',
      description: 'Penanganan penyakit metabolik, diabetes, hipertensi, pencernaan, dan gangguan ginjal oleh tim konsultan senior.',
      englishDescription: 'Comprehensive treatment for metabolic, diabetes, hypertension, digestive, and kidney disorders by senior consultants.',
      services: ['Konsultasi Diabetes & Endokrin', 'Endoskopi Saluran Cerna', 'Skrining Kardiometabolik'],
      icon: 'HeartPulse',
      color: 'bg-blue-50 text-[#0052CC] border-blue-200',
    };
  }
  if (lower.includes('anak')) {
    return {
      name: 'Poliklinik Anak & Tumbuh Kembang',
      englishName: 'Pediatric & Child Health',
      code: 'POLI-PED',
      description: 'Layanan kesehatan anak terlengkap dari imunisasi rutin, tumbuh kembang, hingga penanganan penyakit infeksi anak.',
      englishDescription: 'Comprehensive pediatric care from routine immunizations to child development and infection management.',
      services: ['Imunisasi Lengkap Anak', 'Klinik Tumbuh Kembang & Terapi', 'Rawat Intensif Anak (PICU/NICU)'],
      icon: 'Users',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    };
  }
  if (lower.includes('obgyn') || lower.includes('kebidanan') || lower.includes('kandungan') || lower.includes('ginekologi')) {
    return {
      name: 'Kebidanan & Kandungan (Obgyn)',
      englishName: 'Obstetrics & Gynecology',
      code: 'POLI-OBG',
      description: 'Pemeriksaan kehamilan USG 4D, persalinan aman (ERACS), pemeriksaan pap smear, dan kesehatan reproduksi wanita.',
      englishDescription: '4D Ultrasound fetal checkup, ERACS safe delivery, Pap smear screening, and women reproduction health.',
      services: ['Pemeriksaan Kehamilan USG 4D', 'Persalinan Metode ERACS', 'Skrining Kanker Serviks'],
      icon: 'Heart',
      color: 'bg-pink-50 text-pink-600 border-pink-200',
    };
  }
  if (lower.includes('jantung') || lower.includes('kardio') || lower.includes('pembuluh')) {
    return {
      name: 'Pusat Jantung & Pembuluh Darah',
      englishName: 'Cardiovascular Center',
      code: 'POLI-CAR',
      description: 'Diagnosis presisi gangguan ritme jantung, EKG, Echocardiography, dan rehabilitasi jantung terpadu.',
      englishDescription: 'Precision diagnosis for cardiac rhythm disorders, ECG, Echocardiography, and cardiac rehabilitation.',
      services: ['Echocardiography Doppler', 'Treadmill Stress Test', 'Unit Perawatan Intensif Jantung (ICCU)'],
      icon: 'Activity',
      color: 'bg-red-50 text-red-600 border-red-200',
    };
  }
  if (lower.includes('bedah')) {
    return {
      name: 'Poliklinik Bedah Umum & Ortopedi',
      englishName: 'General & Orthopedic Surgery',
      code: 'POLI-SUR',
      description: 'Bedah minimal invasif (Laparoskopi), operasi fraktur tulang, serta perawatan luka kronis dan pasca operasi.',
      englishDescription: 'Minimally invasive laparoscopic surgery, bone fracture repair, and chronic wound management.',
      services: ['Bedah Laparoskopi Minimal Invasif', 'Operasi Tulang & Sendi (Ortopedi)', 'Kamar Bedah Steril HEPA Filter'],
      icon: 'Stethoscope',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };
  }
  if (lower.includes('saraf') || lower.includes('neuro') || lower.includes('stroke')) {
    return {
      name: 'Poliklinik Saraf & Stroke Unit',
      englishName: 'Neurology & Stroke Center',
      code: 'POLI-NEU',
      description: 'Penanganan cepat serangan stroke akut, migrain kronis, saraf terjepit (HNP), dan pemeriksaan EEG.',
      englishDescription: 'Fast treatment for acute stroke, chronic migraine, pinched nerves (HNP), and EEG brain scanning.',
      services: ['Unit Stroke 24 Jam Cepat Tanggap', 'Pemeriksaan EEG & EMG', 'Terapi Saraf & Neurologi'],
      icon: 'Brain',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    };
  }

  // Dynamic fallback for any custom department in User module
  const cleanDept = dept.trim();
  const codePrefix = cleanDept.substring(0, 3).toUpperCase();
  return {
    name: cleanDept.startsWith('Poli') ? cleanDept : `Poliklinik ${cleanDept}`,
    englishName: `${cleanDept} Specialty Clinic`,
    code: `POLI-${codePrefix}`,
    description: `Penanganan medis terpadu spesialis ${cleanDept} oleh tim konsultan dokter senior.`,
    englishDescription: `Comprehensive specialized medical care for ${cleanDept} led by senior consultant doctors.`,
    services: [`Konsultasi Spesialis ${cleanDept}`, `Pemeriksaan Diagnostik ${cleanDept}`, `Tim Dokter DPJP ${cleanDept}`],
    icon: 'Stethoscope',
    color: 'bg-blue-50 text-[#0052CC] border-blue-200',
  };
};

// Helper to seed polyclinics dynamically from User table's doctor departments
const seedPolyclinicsIfEmpty = async () => {
  try {
    const count = await prisma.polyclinic.count();
    if (count === 0) {
      // Fetch unique departments from Users table for doctors
      const doctors = await prisma.user.findMany({
        where: { role: 'DOCTOR', isActive: true },
        select: { department: true },
      });

      const uniqueDepts = Array.from(new Set(doctors.map((d) => d.department).filter(Boolean)));

      if (uniqueDepts.length === 0) {
        uniqueDepts.push('Penyakit Dalam', 'Anak', 'Obstetri & Ginekologi', 'Jantung dan Pembuluh Darah');
      }

      let order = 1;
      for (const dept of uniqueDepts) {
        const preset = mapDeptToPolyPreset(dept);
        const existing = await prisma.polyclinic.findFirst({
          where: { name: preset.name },
        });

        if (!existing) {
          await prisma.polyclinic.create({
            data: {
              ...preset,
              sortOrder: order++,
              isActive: true,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('seedPolyclinicsIfEmpty error:', err);
  }
};

// GET /api/polyclinics - List all polyclinics for Admin & Internal Dashboard
const getPolyclinics = async (req, res) => {
  try {
    await seedPolyclinicsIfEmpty();
    const { search, status } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { englishName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status !== undefined && status !== '') {
      where.isActive = status === 'active' || status === 'true';
    }

    const polyclinics = await prisma.polyclinic.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    res.json({
      success: true,
      data: { polyclinics },
      polyclinics,
    });
  } catch (error) {
    console.error('Get polyclinics error:', error);
    res.status(500).json({ error: 'Gagal mengambil data poliklinik' });
  }
};

// GET /api/polyclinics/public - List active polyclinics for Public Landing Page
const getPublicPolyclinics = async (req, res) => {
  try {
    await seedPolyclinicsIfEmpty();

    const polyclinics = await prisma.polyclinic.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    res.json({
      success: true,
      data: { polyclinics },
      polyclinics,
    });
  } catch (error) {
    console.error('Get public polyclinics error:', error);
    res.status(500).json({ error: 'Gagal mengambil data poliklinik publik' });
  }
};

// GET /api/polyclinics/:id
const getPolyclinicById = async (req, res) => {
  try {
    const { id } = req.params;
    const polyclinic = await prisma.polyclinic.findUnique({
      where: { id: parseInt(id) },
    });

    if (!polyclinic) {
      return res.status(404).json({ error: 'Poliklinik tidak ditemukan' });
    }

    res.json({ success: true, data: { polyclinic }, polyclinic });
  } catch (error) {
    console.error('Get polyclinic by id error:', error);
    res.status(500).json({ error: 'Gagal mengambil rincian poliklinik' });
  }
};

// POST /api/polyclinics - Create new polyclinic
const createPolyclinic = async (req, res) => {
  try {
    const { name, englishName, code, description, englishDescription, services, icon, color, isActive, sortOrder } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nama poliklinik wajib diisi' });
    }

    // Check duplicate name or code
    const existing = await prisma.polyclinic.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: 'insensitive' } },
          code ? { code: { equals: code.trim(), mode: 'insensitive' } } : {},
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Poliklinik dengan nama atau kode yang sama sudah ada' });
    }

    let parsedServices = services;
    if (typeof services === 'string') {
      parsedServices = services.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const newPoly = await prisma.polyclinic.create({
      data: {
        name: name.trim(),
        englishName: englishName ? englishName.trim() : null,
        code: code ? code.trim().toUpperCase() : `POLI-${Math.floor(100 + Math.random() * 900)}`,
        description: description ? description.trim() : null,
        englishDescription: englishDescription ? englishDescription.trim() : null,
        services: Array.isArray(parsedServices) ? parsedServices : [],
        icon: icon || 'Stethoscope',
        color: color || 'bg-blue-50 text-[#0052CC] border-blue-200',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Poliklinik berhasil ditambahkan',
      data: { polyclinic: newPoly },
      polyclinic: newPoly,
    });
  } catch (error) {
    console.error('Create polyclinic error:', error);
    res.status(500).json({ error: error.message || 'Gagal menambahkan poliklinik baru' });
  }
};

// PUT /api/polyclinics/:id - Update polyclinic
const updatePolyclinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, englishName, code, description, englishDescription, services, icon, color, isActive, sortOrder } = req.body;

    const existing = await prisma.polyclinic.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Poliklinik tidak ditemukan' });
    }

    let parsedServices = services;
    if (typeof services === 'string') {
      parsedServices = services.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const updated = await prisma.polyclinic.update({
      where: { id: parseInt(id) },
      data: {
        name: name ? name.trim() : existing.name,
        englishName: englishName !== undefined ? (englishName ? englishName.trim() : null) : existing.englishName,
        code: code ? code.trim().toUpperCase() : existing.code,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        englishDescription: englishDescription !== undefined ? (englishDescription ? englishDescription.trim() : null) : existing.englishDescription,
        services: Array.isArray(parsedServices) ? parsedServices : existing.services,
        icon: icon || existing.icon,
        color: color || existing.color,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder,
      },
    });

    res.json({
      success: true,
      message: 'Poliklinik berhasil diperbarui',
      data: { polyclinic: updated },
      polyclinic: updated,
    });
  } catch (error) {
    console.error('Update polyclinic error:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui poliklinik' });
  }
};

// DELETE /api/polyclinics/:id - Delete polyclinic
const deletePolyclinic = async (req, res) => {
  try {
    const { id } = req.params;
    const polyclinicId = parseInt(id);

    const existing = await prisma.polyclinic.findUnique({
      where: { id: polyclinicId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Poliklinik tidak ditemukan' });
    }

    await prisma.polyclinic.delete({
      where: { id: polyclinicId },
    });

    res.json({
      success: true,
      message: 'Poliklinik berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete polyclinic error:', error);
    res.status(500).json({ error: 'Gagal menghapus poliklinik' });
  }
};

module.exports = {
  getPolyclinics,
  getPublicPolyclinics,
  getPolyclinicById,
  createPolyclinic,
  updatePolyclinic,
  deletePolyclinic,
};
