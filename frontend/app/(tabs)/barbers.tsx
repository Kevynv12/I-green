import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function BarbersScreen() {
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    commission_percentage: 50,
    is_active: true,
  });

  const loadBarbers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/barbers');
      setBarbers(response.data);
    } catch (error) {
      console.error('Error loading barbers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarbers();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      phone: '',
      email: '',
      commission_percentage: 50,
      is_active: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (barber: any) => {
    setModalMode('edit');
    setSelectedBarber(barber);
    setFormData({
      name: barber.name,
      phone: barber.phone || '',
      email: barber.email || '',
      commission_percentage: barber.commission_percentage,
      is_active: barber.is_active,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    if (formData.commission_percentage < 0 || formData.commission_percentage > 100) {
      Alert.alert('Erro', 'Comissão deve ser entre 0% e 100%');
      return;
    }

    try {
      if (modalMode === 'create') {
        await api.post('/barbers', formData);
        Alert.alert('Sucesso', 'Barbeiro cadastrado!');
      } else {
        await api.put(`/barbers/${selectedBarber.id}`, formData);
        Alert.alert('Sucesso', 'Barbeiro atualizado!');
      }
      setModalVisible(false);
      loadBarbers();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao salvar');
    }
  };

  const handleDelete = (barber: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir ${barber.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/barbers/${barber.id}`);
              Alert.alert('Sucesso', 'Barbeiro excluído!');
              loadBarbers();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir barbeiro');
            }
          },
        },
      ]
    );
  };

  const renderBarber = ({ item }: any) => (
    <TouchableOpacity
      style={styles.barberCard}
      onPress={() => openEditModal(item)}
    >
      <LinearGradient
        colors={item.is_active ? ['#22d3ee15', '#a855f715'] : ['#33415515', '#33415515']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.barberGradient}
      >
        <View style={[styles.barberAvatar, !item.is_active && { opacity: 0.5 }]}>
          <Ionicons name="person" size={32} color={item.is_active ? '#22d3ee' : '#64748b'} />
        </View>
        <View style={styles.barberInfo}>
          <View style={styles.barberHeader}>
            <Text style={[styles.barberName, !item.is_active && { color: '#64748b' }]}>
              {item.name}
            </Text>
            {!item.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>INATIVO</Text>
              </View>
            )}
          </View>
          <Text style={styles.barberPhone}>{item.phone || 'Sem telefone'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cut-outline" size={14} color="#22d3ee" />
              <Text style={styles.statText}>{item.total_services} serviços</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={14} color="#10b981" />
              <Text style={styles.statText}>R$ {item.total_earned.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.commissionContainer}>
            <Text style={styles.commissionLabel}>COMISSÃO:</Text>
            <Text style={styles.commissionValue}>{item.commission_percentage}%</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Barbeiros</Text>
          <Text style={styles.subtitle}>{barbers.length} na equipe</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add-circle" size={36} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      {barbers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#334155" />
          <Text style={styles.emptyText}>Nenhum barbeiro cadastrado</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
            <Text style={styles.emptyButtonText}>ADICIONAR BARBEIRO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={barbers}
          renderItem={renderBarber}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Novo Barbeiro' : 'Editar Barbeiro'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do barbeiro..."
                placeholderTextColor="#475569"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#475569"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@exemplo.com"
                placeholderTextColor="#475569"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Comissão (%)</Text>
              <View style={styles.commissionSlider}>
                <TextInput
                  style={styles.commissionInput}
                  placeholder="50"
                  placeholderTextColor="#475569"
                  value={formData.commission_percentage.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    setFormData({ ...formData, commission_percentage: num });
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.commissionPercent}>%</Text>
              </View>
              <Text style={styles.helperText}>
                Exemplo: 50% = R$ 50 de comissão em um serviço de R$ 100
              </Text>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Barbeiro Ativo</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    formData.is_active && styles.switchActive,
                  ]}
                  onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      formData.is_active && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                <Text style={styles.submitButtonText}>
                  {modalMode === 'create' ? 'CADASTRAR BARBEIRO' : 'SALVAR ALTERAÇÕES'}
                </Text>
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
  subtitle: {
    fontSize: 14,
    color: '#22d3ee',
    fontWeight: '700',
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
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
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
  },
  barberCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  barberGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  barberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  barberInfo: {
    flex: 1,
  },
  barberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  inactiveBadge: {
    backgroundColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  barberPhone: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  commissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  commissionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#22d3ee',
    letterSpacing: 1,
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#22d3ee',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  commissionSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  commissionInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  commissionPercent: {
    fontSize: 24,
    fontWeight: '900',
    color: '#22d3ee',
    paddingRight: 16,
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    padding: 4,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#22d3ee',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  submitButton: {
    backgroundColor: '#22d3ee',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});