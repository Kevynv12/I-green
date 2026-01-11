import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FinancialScreen() {
  const [loading, setLoading] = useState(true);
  const [financial, setFinancial] = useState<any>(null);

  const loadFinancial = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/financial');
      setFinancial(response.data);
    } catch (error) {
      console.error('Error loading financial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancial();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22d3ee" />
        </View>
      </SafeAreaView>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon, colors }: any) => (
    <LinearGradient colors={colors} style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Financeiro</Text>
          <View style={styles.badge}>
            <Ionicons name="trending-up" size={16} color="#10b981" />
            <Text style={styles.badgeText}>TEMPO REAL</Text>
          </View>
        </View>

        <MetricCard
          title="FATURAMENTO TOTAL"
          value={`R$ ${financial?.total_revenue?.toFixed(2) || '0.00'}`}
          subtitle={`Serviços: R$ ${financial?.services_revenue?.toFixed(2) || '0.00'} • Produtos: R$ ${financial?.products_revenue?.toFixed(2) || '0.00'}`}
          icon="cash-outline"
          colors={['#0ea5e9', '#22d3ee']}
        />

        <MetricCard
          title="LUCRO LÍQUIDO"
          value={`R$ ${financial?.net_profit?.toFixed(2) || '0.00'}`}
          subtitle="Receita - Comissões - Custos"
          icon="wallet-outline"
          colors={['#059669', '#10b981']}
        />

        <MetricCard
          title="COMISSÕES PAGAS"
          value={`R$ ${financial?.total_barber_commission?.toFixed(2) || '0.00'}`}
          subtitle="Total pago aos barbeiros"
          icon="people-outline"
          colors={['#7c3aed', '#a855f7']}
        />

        <MetricCard
          title="CUSTO DE PRODUTOS"
          value={`R$ ${financial?.total_products_cost?.toFixed(2) || '0.00'}`}
          subtitle="Custo total de produtos vendidos"
          icon="cube-outline"
          colors={['#dc2626', '#ef4444']}
        />

        {financial?.barber_performance && financial.barber_performance.length > 0 && (
          <View style={styles.performanceSection}>
            <Text style={styles.sectionTitle}>PERFORMANCE POR BARBEIRO</Text>
            {financial.barber_performance.map((barber: any, index: number) => (
              <View key={index} style={styles.barberPerformanceCard}>
                <View style={styles.barberPerformanceHeader}>
                  <View style={styles.barberPerformanceIcon}>
                    <Ionicons name="person" size={20} color="#22d3ee" />
                  </View>
                  <Text style={styles.barberPerformanceName}>{barber.name}</Text>
                </View>
                <View style={styles.barberPerformanceStats}>
                  <View style={styles.barberPerformanceStat}>
                    <Text style={styles.barberPerformanceStatLabel}>Serviços</Text>
                    <Text style={styles.barberPerformanceStatValue}>
                      {barber.total_services}
                    </Text>
                  </View>
                  <View style={styles.barberPerformanceStat}>
                    <Text style={styles.barberPerformanceStatLabel}>Ganhos</Text>
                    <Text style={[styles.barberPerformanceStatValue, { color: '#10b981' }]}>
                      R$ {barber.total_earned.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  metricCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  metricIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  performanceSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 16,
  },
  barberPerformanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  barberPerformanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barberPerformanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  barberPerformanceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  barberPerformanceStats: {
    flexDirection: 'row',
    gap: 12,
  },
  barberPerformanceStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  barberPerformanceStatLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barberPerformanceStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#22d3ee',
    marginTop: 4,
  },
});