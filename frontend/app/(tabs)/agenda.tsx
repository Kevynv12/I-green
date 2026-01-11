import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgendaScreen() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    service_id: '',
    service_name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    price: 0,
    barber_name: '',
  });

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00',
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [aptsRes, clientsRes, servicesRes] = await Promise.all([
        api.get(`/appointments?date=${dateStr}&status=confirmed`),
        api.get('/clients'),
        api.get('/services'),
      ]);
      setAppointments(aptsRes.data);
      setClients(clientsRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleCreateAppointment = async () => {
    if (!formData.client_name || !formData.service_name || !formData.time) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      await api.post('/appointments', formData);
      Alert.alert('Sucesso', 'Agendamento criado!');
      setModalVisible(false);
      loadData();
      resetForm();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao criar agendamento');
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      await api.put(`/appointments/${id}/complete`);
      Alert.alert('Sucesso', 'Atendimento concluído!');
      loadData();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao concluir');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja realmente cancelar este agendamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/appointments/${id}`);
              loadData();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao cancelar agendamento');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      client_name: '',
      service_id: '',
      service_name: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '',
      price: 0,
      barber_name: '',
    });
  };

  const openModal = () => {
    resetForm();
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22d3ee" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Ionicons name="add-circle" size={32} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
        >
          <Ionicons name="chevron-back" size={24} color="#22d3ee" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Text>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
        >
          <Ionicons name="chevron-forward" size={24} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#334155" />
            <Text style={styles.emptyText}>Nenhum agendamento para esta data</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openModal}>
              <Text style={styles.emptyButtonText}>CRIAR AGENDAMENTO</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((apt: any) => (
            <View key={apt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={16} color="#22d3ee" />
                  <Text style={styles.timeText}>{apt.time}</Text>
                </View>
                <View style={styles.appointmentActions}>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteAppointment(apt.id)}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAppointment(apt.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.clientName}>{apt.client_name}</Text>
              <Text style={styles.serviceInfo}>
                {apt.service_name} • R$ {apt.price}
              </Text>
              {apt.barber_name && (
                <Text style={styles.barberInfo}>Barbeiro: {apt.barber_name}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Agendamento</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Client Name */}
              <Text style={styles.label}>Nome do Cliente</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome..."
                placeholderTextColor="#475569"
                value={formData.client_name}
                onChangeText={(text) => setFormData({ ...formData, client_name: text })}
              />

              {/* Service Selection */}
              <Text style={styles.label}>Serviço</Text>
              <View style={styles.serviceGrid}>
                {services.map((service: any) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceChip,
                      formData.service_id === service.id && styles.serviceChipSelected,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        service_id: service.id,
                        service_name: service.name,
                        price: service.price,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        formData.service_id === service.id && styles.serviceChipTextSelected,
                      ]}
                    >
                      {service.name}
                    </Text>
                    <Text style={styles.servicePrice}>R$ {service.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Selection */}
              <Text style={styles.label}>Horário</Text>
              <View style={styles.timeGrid}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeChip,
                      formData.time === time && styles.timeChipSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, time })}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        formData.time === time && styles.timeChipTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Barber Name (Optional) */}
              <Text style={styles.label}>Barbeiro (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do barbeiro..."
                placeholderTextColor="#475569"
                value={formData.barber_name}
                onChangeText={(text) => setFormData({ ...formData, barber_name: text })}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleCreateAppointment}>
                <Text style={styles.submitButtonText}>CONFIRMAR AGENDAMENTO</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  addButton: {
    padding: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#22d3ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    color: '#22d3ee',
    fontWeight: '900',
    marginLeft: 6,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  serviceInfo: {
    fontSize: 14,
    color: '#64748b',
  },
  barberInfo: {
    fontSize: 12,
    color: '#22d3ee',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  modalForm: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22d3ee',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  serviceChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: '48%',
  },
  serviceChipSelected: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: '#22d3ee',
  },
  serviceChipText: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceChipTextSelected: {
    color: '#22d3ee',
  },
  servicePrice: {
    color: '#64748b',
    fontSize: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
    alignItems: 'center',
  },
  timeChipSelected: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: '#22d3ee',
  },
  timeChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  timeChipTextSelected: {
    color: '#22d3ee',
  },
  submitButton: {
    backgroundColor: '#22d3ee',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});