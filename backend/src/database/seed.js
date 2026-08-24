const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function main() {
  console.log('🌱 Memulai seeding database...');

  try {
    // Array untuk menyimpan semua users
    const users = [];

    // Buat user admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@klinik.com' },
      update: {},
      create: {
        name: 'Administrator Sistem',
        email: 'admin@klinik.com',
        password: hashedPassword,
        role: 'ADMIN',
        department: 'Administrasi',
        phone: '+6281234567890'
      }
    });

    users.push(adminUser);
    console.log('✅ User admin dibuat:', adminUser.email);

    // Buat user contoh
    const sampleUsers = [
      {
        name: 'dr. Ahmad Hidayat, Sp.PD',
        email: 'ahmad.hidayat@klinik.com',
        password: hashedPassword,
        role: 'DOCTOR',
        department: 'Penyakit Dalam',
        phone: '+6281234567891'
      },
      {
        name: 'dr. Siti Nurhaliza, Sp.A',
        email: 'siti.nurhaliza@klinik.com',
        password: hashedPassword,
        role: 'DOCTOR',
        department: 'Anak',
        phone: '+6281234567892'
      },
      {
        name: 'dr. Budi Santoso, Sp.OG',
        email: 'budi.santoso@klinik.com',
        password: hashedPassword,
        role: 'DOCTOR',
        department: 'Obstetri & Ginekologi',
        phone: '+6281234567893'
      },
      {
        name: 'dr. Rina Kusuma, Sp.JP',
        email: 'rina.kusuma@klinik.com',
        password: hashedPassword,
        role: 'DOCTOR',
        department: 'Jantung dan Pembuluh Darah',
        phone: '+6281234567894'
      },
      {
        name: 'Dewi Lestari, S.Kep',
        email: 'dewi.lestari@klinik.com',
        password: hashedPassword,
        role: 'NURSE',
        department: 'Perawat Umum',
        phone: '+6281234567895'
      },
      {
        name: 'Ani Wijaya, S.Kep',
        email: 'ani.wijaya@klinik.com',
        password: hashedPassword,
        role: 'NURSE',
        department: 'Perawat IGD',
        phone: '+6281234567896'
      },
      {
        name: 'Rudi Hartono',
        email: 'rudi.hartono@klinik.com',
        password: hashedPassword,
        role: 'FRONT_DESK',
        department: 'Pendaftaran',
        phone: '+6281234567897'
      },
      {
        name: 'Sari Indah, S.Farm',
        email: 'sari.indah@klinik.com',
        password: hashedPassword,
        role: 'PHARMACY',
        department: 'Apotek',
        phone: '+6281234567898'
      }
    ];

    for (const userData of sampleUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData
      });
      users.push(user);
      console.log(`✅ User dibuat: ${user.name} (${user.role})`);
    }

    // Buat obat-obatan contoh
    const sampleMedicines = [
      {
        name: 'Paracetamol 500mg',
        description: 'Pereda nyeri dan penurun demam',
        unit: 'Tablet',
        price: 5000
      },
      {
        name: 'Amoxicillin 500mg',
        description: 'Antibiotik untuk infeksi bakteri',
        unit: 'Kapsul',
        price: 8500
      },
      {
        name: 'Omeprazole 20mg',
        description: 'Obat maag dan asam lambung',
        unit: 'Kapsul',
        price: 12000
      },
      {
        name: 'Metformin 500mg',
        description: 'Obat diabetes tipe 2',
        unit: 'Tablet',
        price: 15000
      },
      {
        name: 'Antasida DOEN',
        description: 'Menetralkan asam lambung',
        unit: 'Tablet',
        price: 3500
      },
      {
        name: 'CTM 4mg',
        description: 'Obat alergi (antihistamin)',
        unit: 'Tablet',
        price: 2500
      },
      {
        name: 'Vitamin B Complex',
        description: 'Suplemen vitamin B kompleks',
        unit: 'Tablet',
        price: 6000
      },
      {
        name: 'Ibuprofen 400mg',
        description: 'Pereda nyeri dan anti inflamasi',
        unit: 'Tablet',
        price: 7500
      },
      {
        name: 'Salbutamol Inhaler',
        description: 'Obat asma (bronkodilator)',
        unit: 'Inhaler',
        price: 45000
      },
      {
        name: 'Amlodipine 5mg',
        description: 'Obat hipertensi',
        unit: 'Tablet',
        price: 18000
      }
    ];

    for (const medicineData of sampleMedicines) {
      const medicine = await prisma.medicine.create({
        data: medicineData
      });

      // Buat batch untuk setiap obat
      await prisma.medicineBatch.create({
        data: {
          medicineId: medicine.id,
          batchNo: `BATCH-${Date.now()}-${medicine.id}`,
          stock: Math.floor(Math.random() * 150) + 100,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 tahun dari sekarang
        }
      });

      console.log(`✅ Obat dibuat: ${medicine.name}`);
    }

    // Buat ruangan contoh
    const roomTypes = ['VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION'];
    const facilities = [
      ['AC', 'TV', 'BATHROOM', 'WIFI'],
      ['AC', 'BATHROOM', 'WIFI'],
      ['AC', 'BATHROOM'],
      ['BATHROOM'],
      ['AC', 'BATHROOM', 'WIFI'],
      ['AC', 'BATHROOM', 'WIFI'],
      ['AC', 'BATHROOM', 'WIFI'],
      ['AC', 'BATHROOM']
    ];
    
    for (let i = 1; i <= 20; i++) {
      const roomTypeIndex = Math.floor(Math.random() * roomTypes.length);
      const roomType = roomTypes[roomTypeIndex];
      const roomNumber = `R${i.toString().padStart(3, '0')}`;
      const room = await prisma.room.upsert({
        where: { roomNumber },
        update: {
          roomType: roomType,
          status: 'AVAILABLE',
          isActive: true
        },
        create: {
          roomNumber,
          roomName: `${roomType} Suite ${i}`,
          roomType: roomType,
          bedCapacity: roomType === 'ICU' || roomType === 'NICU' || roomType === 'PICU' ? 1 : (roomType === 'VIP' ? 1 : Math.floor(Math.random() * 2) + 1),
          pricePerDay: roomType === 'VIP' ? 2000000 : (roomType === 'KELAS_1' ? 1000000 : (roomType === 'KELAS_2' ? 750000 : (roomType === 'KELAS_3' ? 500000 : (roomType === 'ICU' || roomType === 'NICU' || roomType === 'PICU' ? 3000000 : 1500000)))),
          floor: Math.floor(i / 5) + 1,
          building: i <= 10 ? 'Gedung A' : 'Gedung B',
          facilities: facilities[roomTypeIndex],
          description: `Kamar rawat inap tipe ${roomType}`,
          status: 'AVAILABLE'
        }
      });
      console.log(`✅ Ruangan dibuat/diperbarui: ${room.roomNumber} - ${room.roomType}`);
    }

    // Buat data pasien contoh
    const patientNames = [
      { name: 'Budi Santoso', gender: 'MALE', phone: '+6281234567890' },
      { name: 'Siti Aminah', gender: 'FEMALE', phone: '+6281234567891' },
      { name: 'Ahmad Wijaya', gender: 'MALE', phone: '+6281234567892' },
      { name: 'Dewi Kusuma', gender: 'FEMALE', phone: '+6281234567893' },
      { name: 'Rudi Hartono', gender: 'MALE', phone: '+6281234567894' },
      { name: 'Nia Rahayu', gender: 'FEMALE', phone: '+6281234567895' },
      { name: 'Eko Prasetyo', gender: 'MALE', phone: '+6281234567896' },
      { name: 'Lina Marlina', gender: 'FEMALE', phone: '+6281234567897' },
      { name: 'Joko Susilo', gender: 'MALE', phone: '+6281234567898' },
      { name: 'Maya Sari', gender: 'FEMALE', phone: '+6281234567899' }
    ];

    const patients = [];
    for (let i = 0; i < patientNames.length; i++) {
      const patientData = patientNames[i];
      const medicalRecordNo = `MR${(i + 1).toString().padStart(6, '0')}`;
      const patient = await prisma.patient.upsert({
        where: { medicalRecordNo },
        update: {
          name: patientData.name,
          gender: patientData.gender,
          phone: patientData.phone
        },
        create: {
          medicalRecordNo,
          name: patientData.name,
          dateOfBirth: new Date(Date.now() - Math.floor(Math.random() * 30 * 365 * 24 * 60 * 60 * 1000) - (18 * 365 * 24 * 60 * 60 * 1000)),
          gender: patientData.gender,
          phone: patientData.phone,
          address: `Jl. Merdeka No. ${Math.floor(Math.random() * 100) + 1}, Jakarta`,
          emergencyContact: {
            name: `Keluarga ${patientData.name}`,
            phone: `+628123456${Math.floor(Math.random() * 9000) + 1000}`,
            relation: 'Keluarga'
          }
        }
      });
      patients.push(patient);
      console.log(`✅ Pasien dibuat/diperbarui: ${patient.name}`);
    }

    // Ambil list rooms dan doctors untuk membuat inpatient records
    const allRooms = await prisma.room.findMany({ where: { isActive: true } });
    const allDoctors = users.filter(u => u.role === 'DOCTOR');

    // Buat beberapa data rawat inap (inpatients)
    const inpatientData = [
      {
        patientIndex: 0, // Budi Santoso
        roomIndex: 0, // R001
        bedNumber: 1,
        doctorIndex: 0,
        initialDiagnosis: 'Post-operative care after appendectomy',
        daysAgo: 3,
        estimatedDays: 7,
        status: 'ACTIVE'
      },
      {
        patientIndex: 1, // Siti Aminah
        roomIndex: 1, // R002
        bedNumber: 1,
        doctorIndex: 1,
        initialDiagnosis: 'Pneumonia with respiratory distress',
        daysAgo: 5,
        estimatedDays: 10,
        status: 'ACTIVE'
      },
      {
        patientIndex: 2, // Ahmad Wijaya
        roomIndex: 4, // ICU room
        bedNumber: 1,
        doctorIndex: 2,
        initialDiagnosis: 'Severe head trauma, requires ICU monitoring',
        daysAgo: 2,
        estimatedDays: 15,
        status: 'ACTIVE'
      },
      {
        patientIndex: 3, // Dewi Kusuma
        roomIndex: 2, // R003
        bedNumber: 1,
        doctorIndex: 0,
        initialDiagnosis: 'Gestational diabetes monitoring',
        daysAgo: 1,
        estimatedDays: 5,
        status: 'ACTIVE'
      },
      {
        patientIndex: 4, // Rudi Hartono
        roomIndex: 3, // R004
        bedNumber: 1,
        doctorIndex: 1,
        initialDiagnosis: 'Dengue fever grade 2',
        daysAgo: 4,
        estimatedDays: 7,
        status: 'ACTIVE'
      }
    ];

    for (let i = 0; i < inpatientData.length; i++) {
      const data = inpatientData[i];
      const patient = patients[data.patientIndex];
      const room = allRooms[data.roomIndex];
      const doctor = allDoctors[data.doctorIndex];
      
      // Check if patient already has active occupancy
      const existingOccupancy = await prisma.roomOccupancy.findFirst({
        where: {
          patientId: patient.id,
          status: 'ACTIVE'
        }
      });

      if (existingOccupancy) {
        console.log(`⏭️  Pasien ${patient.name} sudah memiliki okupansi aktif, dilewati`);
        continue;
      }
      
      const checkedInAt = new Date(Date.now() - data.daysAgo * 24 * 60 * 60 * 1000);
      const estimatedCheckoutAt = new Date(Date.now() + (data.estimatedDays - data.daysAgo) * 24 * 60 * 60 * 1000);
      
      // Generate registration number
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const registrationNumber = `INP-${dateStr}-${String(i + 1).padStart(4, '0')}`;

      const occupancy = await prisma.roomOccupancy.create({
        data: {
          registrationNumber,
          patientId: patient.id,
          roomId: room.id,
          bedNumber: data.bedNumber,
          doctorId: doctor.id,
          checkedInAt,
          estimatedCheckoutAt,
          initialDiagnosis: data.initialDiagnosis,
          status: data.status,
          notes: `Patient admitted ${data.daysAgo} days ago`
        }
      });

      // Update room status to OCCUPIED
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'OCCUPIED' }
      });

      console.log(`✅ Rawat inap dibuat: ${patient.name} - ${room.roomNumber}`);
    }

    // Ambil semua data yang sudah dibuat untuk membuat visits
    const doctors = users.filter(u => u.role === 'DOCTOR');

    // Doctor prefix map: doctor index -> 'A', 'B', 'C', 'D'
    const getDoctorPrefix = (index) => String.fromCharCode(65 + (index % 26));

    // Doctor queue counters
    const doctorCounters = {};
    doctors.forEach((doc, idx) => {
      doctorCounters[doc.id] = {
        prefix: getDoctorPrefix(idx),
        seqOnsite: 1,
        seqWeb: 1,
        seqIgd: 1
      };
    });

    // Buat kunjungan pasien
    for (let i = 0; i < 15; i++) {
      const patient = patients[i % patients.length];
      const doctorIdx = i % doctors.length;
      const doctor = doctors[doctorIdx];
      const docInfo = doctorCounters[doctor.id];

      const visitTypes = ['OUTPATIENT', 'OUTPATIENT', 'EMERGENCY', 'INPATIENT'];
      const visitType = visitTypes[i % visitTypes.length];
      const channel = i % 3 === 0 ? 'ONLINE_WEBSITE' : 'ONSITE_LOKET';

      let queuePrefix = docInfo.prefix;
      let formattedQueue = '';

      if (visitType === 'EMERGENCY') {
        queuePrefix = `${docInfo.prefix}-IGD`;
        formattedQueue = `${docInfo.prefix}-IGD-${docInfo.seqIgd++}`;
      } else if (channel === 'ONLINE_WEBSITE') {
        queuePrefix = `WEB-${docInfo.prefix}`;
        formattedQueue = `WEB-${docInfo.prefix}-${docInfo.seqWeb++}`;
      } else {
        queuePrefix = docInfo.prefix;
        formattedQueue = `${docInfo.prefix}-${docInfo.seqOnsite++}`;
      }

      const scheduledAt = new Date();
      const statusList = ['SCHEDULED', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SCHEDULED'];
      const status = statusList[i % statusList.length];
      
      const visit = await prisma.visit.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          visitType: visitType,
          channel: channel,
          queuePrefix: queuePrefix,
          queueNumberFormatted: formattedQueue,
          queueNumber: formattedQueue,
          scheduledAt: scheduledAt,
          status: status,
          calledAt: status === 'CALLED' || status === 'IN_PROGRESS' || status === 'COMPLETED' ? new Date() : null,
          notes: `Kunjungan ${visitType.toLowerCase()} (${channel}) untuk ${patient.name}`
        }
      });

      // Buat rekam medis untuk kunjungan yang sudah selesai
      if (visit.status === 'COMPLETED') {
        const diagnoses = [
          'Hipertensi', 'Diabetes Mellitus Tipe 2', 'Gastritis', 'ISPA (Infeksi Saluran Pernapasan Akut)',
          'Demam Berdarah Dengue', 'Asma', 'Dispepsia', 'Vertigo', 'Migrain', 'Tifoid'
        ];
        
        await prisma.medicalRecord.create({
          data: {
            visitId: visit.id,
            patientId: patient.id,
            doctorId: doctor.id,
            diagnosisCode: `ICD${Math.floor(Math.random() * 900) + 100}`,
            diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
            symptoms: 'Keluhan umum pasien seperti demam, pusing, mual',
            treatment: 'Pemberian obat, istirahat yang cukup, dan kontrol rutin',
            prescription: {
              medicines: [
                { name: 'Paracetamol 500mg', quantity: 10, dosage: '3x sehari' },
                { name: 'Amoxicillin 500mg', quantity: 6, dosage: '2x sehari' }
              ]
            },
            attachments: null
          }
        });

        // Buat billing untuk kunjungan yang sudah selesai
        const consultationFee = visitType === 'EMERGENCY' ? 250000 : (visitType === 'INPATIENT' ? 500000 : 150000);
        const medicationCost = Math.floor(Math.random() * 200000) + 50000;
        const roomCharge = visitType === 'INPATIENT' ? (Math.floor(Math.random() * 500000) + 300000) : 0;
        const subtotal = consultationFee + medicationCost + roomCharge;
        const tax = subtotal * 0.1; // PPN 10%
        const discount = 0;
        const total = subtotal + tax - discount;

        await prisma.billing.create({
          data: {
            visitId: visit.id,
            patientId: patient.id,
            items: {
              consultation: consultationFee,
              medication: medicationCost,
              room: roomCharge
            },
            subtotal: subtotal,
            tax: tax,
            discount: discount,
            total: total,
            status: Math.random() > 0.3 ? 'PAID' : 'UNPAID',
            paidAt: Math.random() > 0.3 ? new Date() : null
          }
        });
      }

      console.log(`✅ Kunjungan dibuat: ${patient.name} - Dokter ${docInfo.prefix} (${formattedQueue})`);
    }

    // ========== HISTORICAL DATA FOR AI TRAINING ==========
    console.log('\n🤖 Generating historical data for AI predictions...');
    
    // Generate visits for the last 6 months (for AI training)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const visitTypesForAI = ['GENERAL_CHECKUP', 'OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'MEDICAL_ACTION'];
    const roomTypesForAI = ['VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION'];
    
    // Generate 80 historical visits (random between 50-100)
    const historicalVisitsCount = Math.floor(Math.random() * 51) + 50; // 50-100
    
    for (let i = 0; i < historicalVisitsCount; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      
      // Random visit type with weighted distribution
      let visitType;
      const rand = Math.random();
      if (rand < 0.30) visitType = 'GENERAL_CHECKUP'; // 30%
      else if (rand < 0.55) visitType = 'OUTPATIENT'; // 25%
      else if (rand < 0.75) visitType = 'INPATIENT'; // 20%
      else if (rand < 0.90) visitType = 'EMERGENCY'; // 15%
      else visitType = 'MEDICAL_ACTION'; // 10%
      
      // Random date within last 6 months
      const randomDaysAgo = Math.floor(Math.random() * 180); // 0-180 days
      const visitDate = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000);
      
      await prisma.visit.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          visitType: visitType,
          scheduledAt: visitDate,
          status: 'COMPLETED',
          notes: `Historical ${visitType.toLowerCase()} visit for ML training`
        }
      });
    }
    console.log(`✅ Generated ${historicalVisitsCount} historical visits`);
    
    // Use existing allRooms variable (already declared earlier)
    if (allRooms && allRooms.length > 0) {
      // Generate 60 historical room occupancies (random between 50-100)
      const historicalOccupanciesCount = Math.floor(Math.random() * 51) + 50; // 50-100
      
      for (let i = 0; i < historicalOccupanciesCount; i++) {
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        
        // Select random room with weighted distribution
        let roomType;
        const rand = Math.random();
        if (rand < 0.30) roomType = 'KELAS_1'; // 30%
        else if (rand < 0.55) roomType = 'KELAS_2'; // 25%
        else if (rand < 0.75) roomType = 'VIP'; // 20%
        else if (rand < 0.87) roomType = 'ICU'; // 12%
        else if (rand < 0.95) roomType = 'KELAS_3'; // 8%
        else roomType = roomTypesForAI[Math.floor(Math.random() * roomTypesForAI.length)]; // 5% others
        
        const roomsOfType = allRooms.filter(r => r.roomType === roomType);
        if (roomsOfType.length === 0) continue;
        
        const room = roomsOfType[Math.floor(Math.random() * roomsOfType.length)];
        
        // Random check-in date within last 6 months
        const randomDaysAgo = Math.floor(Math.random() * 180); // 0-180 days
        const checkInDate = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000);
        
        // Random length of stay 1-14 days
        const lengthOfStay = Math.floor(Math.random() * 14) + 1;
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + lengthOfStay);
        
        // Generate unique registration number
        const regNumber = `REG${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        try {
          await prisma.roomOccupancy.create({
            data: {
              registrationNumber: regNumber,
              patientId: patient.id,
              roomId: room.id,
              doctorId: doctor.id,
              bedNumber: Math.floor(Math.random() * room.bedCapacity) + 1,
              checkedInAt: checkInDate,
              checkedOutAt: checkOutDate,
              actualDays: lengthOfStay,
              status: 'CHECKED_OUT',
              initialDiagnosis: 'Historical occupancy for ML training',
              dischargeCondition: ['SEMBUH', 'MEMBAIK', 'RUJUK'][Math.floor(Math.random() * 3)],
              totalRoomCost: room.pricePerDay * lengthOfStay
            }
          });
        } catch (error) {
          // Skip if duplicate registration number
          console.log(`⚠️ Skipped duplicate registration number`);
        }
      }
      console.log(`✅ Generated ${historicalOccupanciesCount} historical room occupancies`);
    } else {
      console.log('⚠️ No rooms found, skipping room occupancy generation');
    }
    
    console.log('🤖 Historical data generation completed!\n');

    // ========== AUDIT LOGS ==========
    console.log('📜 Generating sample audit logs...');
    const auditActions = ['LOGIN', 'CREATE_PATIENT', 'CREATE_VISIT', 'UPDATE_MEDICAL_RECORD', 'ADMIT_INPATIENT', 'DISCHARGE_INPATIENT', 'GENERATE_BILLING', 'PAY_BILLING'];
    const entities = ['User', 'Patient', 'Visit', 'MedicalRecord', 'RoomOccupancy', 'Billing'];

    for (let i = 0; i < 25; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = auditActions[Math.floor(Math.random() * auditActions.length)];
      const entity = entities[Math.floor(Math.random() * entities.length)];
      const randomTime = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: action,
          entity: entity,
          entityId: Math.floor(Math.random() * 10) + 1,
          oldData: { status: 'OLD_VALUE' },
          newData: { status: 'NEW_VALUE', updatedBy: user.email },
          ipAddress: `192.168.1.${Math.floor(Math.random() * 200) + 1}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          createdAt: randomTime
        }
      });
    }
    console.log('✅ Generated 25 sample audit logs\n');

    console.log('🎉 Database berhasil di-seed!');
    console.log('\n📋 Kredensial Login Default:');
    console.log('Email: admin@klinik.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });