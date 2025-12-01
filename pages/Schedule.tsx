import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { appointments, clients, services, addAppointment } = useAppStore();
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formClient, setFormClient] = useState('');
  const [formService, setFormService] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAppointment({
      id: Math.random().toString(),
      clientId: formClient,
      serviceId: formService,
      date: `${formDate}T${formTime}`,
      notes: '',
      status: 'Scheduled'
    });
    setShowModal(false);
  };

  const getDayAppointments = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return appointments.filter(a => a.date.startsWith(checkDate));
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20}/> Novo Agendamento
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft/></button>
          <h2 className="text-xl font-bold text-slate-700 capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight/></button>
        </div>

        <div className="grid grid-cols-7 border-b bg-slate-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-slate-500">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b bg-slate-50/30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const apts = getDayAppointments(day);
            return (
              <div key={day} className="border-r border-b p-2 min-h-[100px] relative hover:bg-blue-50 transition-colors">
                <span className="font-medium text-slate-700 block mb-1">{day}</span>
                <div className="space-y-1">
                  {apts.map(apt => {
                    const client = clients.find(c => c.id === apt.clientId);
                    return (
                      <div key={apt.id} className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate">
                        {apt.date.split('T')[1]} - {client?.name.split(' ')[0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
             <h3 className="text-lg font-bold">Novo Agendamento</h3>
             <input type="date" required className="w-full border p-2 rounded" onChange={e => setFormDate(e.target.value)} />
             <input type="time" required className="w-full border p-2 rounded" onChange={e => setFormTime(e.target.value)} />
             <select required className="w-full border p-2 rounded" onChange={e => setFormClient(e.target.value)}>
               <option value="">Cliente</option>
               {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <select required className="w-full border p-2 rounded" onChange={e => setFormService(e.target.value)}>
               <option value="">Serviço</option>
               {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
             <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};
