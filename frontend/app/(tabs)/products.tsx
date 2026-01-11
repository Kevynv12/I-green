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

export default function ProductsScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    cost_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    barber_commission_percentage: 10,
    description: '',
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      cost_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      barber_commission_percentage: 10,
      description: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (product: any) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      barber_commission_percentage: product.barber_commission_percentage,
      description: product.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    if (formData.sale_price <= 0) {
      Alert.alert('Erro', 'Preço de venda deve ser maior que zero');
      return;
    }

    try {
      if (modalMode === 'create') {
        await api.post('/products', formData);
        Alert.alert('Sucesso', 'Produto cadastrado!');
      } else {
        await api.put(`/products/${selectedProduct.id}`, formData);
        Alert.alert('Sucesso', 'Produto atualizado!');
      }
      setModalVisible(false);
      loadProducts();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao salvar');
    }
  };

  const handleDelete = (product: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir ${product.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${product.id}`);
              Alert.alert('Sucesso', 'Produto excluído!');
              loadProducts();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir produto');
            }
          },
        },
      ]
    );
  };

  const calculateProfit = () => {
    return formData.sale_price - formData.cost_price;
  };

  const calculateMargin = () => {
    if (formData.cost_price === 0) return 0;
    return ((formData.sale_price - formData.cost_price) / formData.cost_price * 100).toFixed(1);
  };

  const renderProduct = ({ item }: any) => {
    const profit = item.sale_price - item.cost_price;
    const isLowStock = item.stock_quantity < 5;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => openEditModal(item)}
      >
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.productGradient}
        >
          <View style={styles.productHeader}>
            <View style={styles.productIcon}>
              <Ionicons name="cube" size={24} color="#22d3ee" />
            </View>
            <View style={styles.stockBadge}>
              <Text style={[styles.stockText, isLowStock && { color: '#ef4444' }]}>
                {item.stock_quantity} un
              </Text>
            </View>
          </View>

          <Text style={styles.productName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.productDescription}>{item.description}</Text>
          )}

          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Custo</Text>
              <Text style={styles.priceCost}>R$ {item.cost_price.toFixed(2)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#64748b" />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Venda</Text>
              <Text style={styles.priceSale}>R$ {item.sale_price.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>LUCRO</Text>
              <Text style={[styles.metricValue, { color: '#10b981' }]}>
                R$ {profit.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MARGEM</Text>
              <Text style={[styles.metricValue, { color: '#22d3ee' }]}>
                {item.profit_margin.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>COMISSÃO</Text>
              <Text style={[styles.metricValue, { color: '#a855f7' }]}>
                {item.barber_commission_percentage}%
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </LinearGradient>
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
          <Text style={styles.title}>Produtos</Text>
          <Text style={styles.subtitle}>{products.length} cadastrados</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add-circle" size={36} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#334155" />
          <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
            <Text style={styles.emptyButtonText}>ADICIONAR PRODUTO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
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
                {modalMode === 'create' ? 'Novo Produto' : 'Editar Produto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.label}>Nome do Produto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Pomada Modeladora"
                placeholderTextColor="#475569"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Preço de Custo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#475569"
                    value={formData.cost_price.toString()}
                    onChangeText={(text) => setFormData({ ...formData, cost_price: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Preço de Venda</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#475569"
                    value={formData.sale_price.toString()}
                    onChangeText={(text) => setFormData({ ...formData, sale_price: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {formData.cost_price > 0 && formData.sale_price > 0 && (
                <View style={styles.calculationCard}>
                  <Text style={styles.calculationTitle}>CÁLCULO AUTOMÁTICO</Text>
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>Lucro por unidade:</Text>
                    <Text style={[styles.calculationValue, { color: '#10b981' }]}>
                      R$ {calculateProfit().toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>Margem de lucro:</Text>
                    <Text style={[styles.calculationValue, { color: '#22d3ee' }]}>
                      {calculateMargin()}%
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Estoque Inicial</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#475569"
                value={formData.stock_quantity.toString()}
                onChangeText={(text) => setFormData({ ...formData, stock_quantity: parseInt(text) || 0 })}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Comissão do Barbeiro (%)</Text>
              <View style={styles.commissionSlider}>
                <TextInput
                  style={styles.commissionInput}
                  placeholder="10"
                  placeholderTextColor="#475569"
                  value={formData.barber_commission_percentage.toString()}
                  onChangeText={(text) => setFormData({ ...formData, barber_commission_percentage: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
                <Text style={styles.commissionPercent}>%</Text>
              </View>
              <Text style={styles.helperText}>
                Comissão que o barbeiro recebe ao vender este produto
              </Text>

              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição do produto..."
                placeholderTextColor="#475569"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                <Text style={styles.submitButtonText}>
                  {modalMode === 'create' ? 'CADASTRAR PRODUTO' : 'SALVAR ALTERAÇÕES'}
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
  productCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  productGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#22d3ee',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceCost: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ef4444',
    marginTop: 4,
  },
  priceSale: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10b981',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  deleteIconButton: {
    position: 'absolute',
    top: 16,
    right: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  calculationCard: {
    backgroundColor: 'rgba(34, 211, 238, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  calculationTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#22d3ee',
    letterSpacing: 1,
    marginBottom: 8,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: '900',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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