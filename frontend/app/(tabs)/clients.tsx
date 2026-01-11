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

// Avatares temáticos de barbearia
const BARBER_AVATARS = [
  { id: 'barber1', icon: 'cut', color: '#22d3ee', label: 'Tesoura Neon' },
  { id: 'barber2', icon: 'flash', color: '#a855f7', label: 'Raio Cyber' },
  { id: 'barber3', icon: 'skull', color: '#ef4444', label: 'Caveira' },
  { id: 'barber4', icon: 'flame', color: '#f59e0b', label: 'Fogo' },
  { id: 'barber5', icon: 'star', color: '#10b981', label: 'Estrela VIP' },
  { id: 'barber6', icon: 'trophy', color: '#eab308', label: 'Troféu' },
  { id: 'barber7', icon: 'rocket', color: '#06b6d4', label: 'Foguete' },
  { id: 'barber8', icon: 'diamond', color: '#ec4899', label: 'Diamante' },
];

export default function ClientsScreen() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    avatar: 'barber1',
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Erro', 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: '',
      avatar: 'barber1',
    });
    setModalVisible(true);
  };

  const openEditModal = (client: any) => {
    setModalMode('edit');
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || '',
      avatar: client.avatar || 'barber1',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    try {
      if (modalMode === 'create') {
        await api.post('/clients', formData);
        Alert.alert('Sucesso', 'Cliente criado!');
      } else {
        await api.put(`/clients/${selectedClient.id}`, formData);
        Alert.alert('Sucesso', 'Cliente atualizado!');
      }
      setModalVisible(false);
      loadClients();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = (client: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir ${client.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clients/${client.id}`);
              Alert.alert('Sucesso', 'Cliente excluído!');
              loadClients();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir cliente');
            }
          },
        },
      ]
    );
  };

  const getAvatarConfig = (avatarId: string) => {
    return BARBER_AVATARS.find(a => a.id === avatarId) || BARBER_AVATARS[0];
  };

  const renderClient = ({ item }: any) => {
    const avatarConfig = getAvatarConfig(item.avatar || 'barber1');
    const daysSinceLastVisit = item.days_since_last_visit;

    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => openEditModal(item)}
      >
        <View style={[styles.avatar, { backgroundColor: `${avatarConfig.color}15` }]}>
          <Ionicons name={avatarConfig.icon as any} size={28} color={avatarConfig.color} />
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientStats}>
            {item.visits} visitas • R$ {item.total_spent.toFixed(2)}
          </Text>
          {item.phone && <Text style={styles.clientPhone}>{item.phone}</Text>}
          {daysSinceLastVisit !== null && daysSinceLastVisit !== undefined && (
            <Text style={styles.lastVisit}>
              {daysSinceLastVisit === 0
                ? '✨ Atendido hoje'
                : `Último corte há ${daysSinceLastVisit} dia${daysSinceLastVisit > 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.count}>{clients.length} total</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add-circle" size={32} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filteredClients.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#334155" />
          <Text style={styles.emptyText}>
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </Text>
          {!search && (
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Text style={styles.emptyButtonText}>ADICIONAR CLIENTE</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal de Criar/Editar */}
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
                {modalMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Avatar Selection */}
              <Text style={styles.label}>Escolha um Avatar</Text>
              <View style={styles.avatarGrid}>
                {BARBER_AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      { backgroundColor: `${avatar.color}15` },
                      formData.avatar === avatar.id && {
                        borderColor: avatar.color,
                        borderWidth: 3,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, avatar: avatar.id })}
                  >
                    <Ionicons name={avatar.icon as any} size={32} color={avatar.color} />
                    <Text style={[styles.avatarLabel, { color: avatar.color }]}>
                      {avatar.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do cliente..."
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

              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notas sobre o cliente..."
                placeholderTextColor="#475569"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                <Text style={styles.submitButtonText}>
                  {modalMode === 'create' ? 'CRIAR CLIENTE' : 'SALVAR ALTERAÇÕES'}
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
  count: {
    fontSize: 14,
    color: '#22d3ee',
    fontWeight: '700',
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
    marginLeft: 12,
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
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  clientStats: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 12,
    color: '#22d3ee',
    marginTop: 2,
  },
  lastVisit: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
