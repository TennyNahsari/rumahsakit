import React from 'react'
import { Printer, X, CheckCircle2, Building2, Calendar, User, Stethoscope } from 'lucide-react'

const ThermalTicketModal = ({ isOpen, onClose, ticketData }) => {
  if (!isOpen || !ticketData) return null

  const handlePrint = () => {
    window.print()
  }

  const {
    queueNumberFormatted = 'A-1',
    patientName = 'Pasien',
    medicalRecordNo = '-',
    doctorName = 'Dokter Spesialis',
    department = 'Poliklinik',
    visitType = 'OUTPATIENT',
    channel = 'ONSITE_LOKET',
    date = new Date().toLocaleDateString('id-ID')
  } = ticketData

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 relative print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Modal Close Button (hidden during print) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center pb-4 border-b border-dashed border-gray-300 print:border-black">
          <div className="flex items-center justify-center space-x-2">
            <Building2 className="w-5 h-5 text-[#0052CC] print:text-black" />
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">RS MEDISYST</h2>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5 print:text-black">
            Struk Antrean Poliklinik Terpadu
          </p>
          <p className="text-[9px] text-gray-400 print:text-black">Jl. Kesehatan Utama No. 88, Jakarta</p>
        </div>

        {/* Queue Number Box */}
        <div className="my-5 py-4 px-3 bg-blue-50 border border-blue-200 rounded-xl text-center print:bg-white print:border-black">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest print:text-black">Nomor Antrean Anda</p>
          <p className="text-4xl sm:text-5xl font-black text-[#0052CC] tracking-tighter my-1 print:text-black">
            {queueNumberFormatted}
          </p>
          <span className="inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white uppercase print:border print:border-black print:bg-white print:text-black">
            {channel === 'ONLINE_WEBSITE' ? 'Pendaftaran Online (Web)' : 'Loket Admisi RS'}
          </span>
        </div>

        {/* Ticket Detail Info */}
        <div className="space-y-2 text-xs border-b border-dashed border-gray-300 pb-4 text-gray-700 print:border-black print:text-black">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium print:text-black">Pasien:</span>
            <span className="font-bold text-gray-900 print:text-black truncate max-w-[180px]">{patientName}</span>
          </div>
          {medicalRecordNo && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium print:text-black">No. RM:</span>
              <span className="font-mono font-bold text-[#0052CC] print:text-black">{medicalRecordNo}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium print:text-black">Dokter:</span>
            <span className="font-semibold text-gray-900 print:text-black truncate max-w-[180px]">{doctorName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium print:text-black">Poliklinik:</span>
            <span className="font-semibold text-gray-900 print:text-black">{department}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium print:text-black">Tanggal:</span>
            <span className="font-medium text-gray-800 print:text-black">{date}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-3 text-[10px] text-gray-500 space-y-1 print:text-black">
          <p className="font-medium">Mohon menunggu nomor antrean Anda dipanggil di layar monitor TV ruang tunggu.</p>
          <p className="text-[9px] text-gray-400 italic print:text-black">Terima kasih atas kepercayaan Anda di RS MediSyst</p>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="mt-6 flex items-center space-x-3 print:hidden">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            Tutup
          </button>

          <button
            onClick={handlePrint}
            className="w-1/2 py-2.5 rounded-xl bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default ThermalTicketModal
