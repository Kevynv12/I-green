import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    totalClients: 0,
    netProfit: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [chartData, setChartData] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      const [appointmentsRes, analyticsRes, clientsRes] = await Promise.all([
        api.get(`/appointments?date=${today}&status=confirmed`),
        api.get('/analytics/financial'),
        api.get('/clients'),
      ]);

      setRecentAppointments(appointmentsRes.data.slice(0, 5));

      setStats({
        totalRevenue: analyticsRes.data.total_revenue || 0,
        totalAppointments: analyticsRes.data.total_appointments || 0,
        totalClients: clientsRes.data.length,
        netProfit: analyticsRes.data.net_profit || 0,
      });

      const chartPoints = analyticsRes.data.chart_data || [];
      if (chartPoints.length > 0) {
        const formattedData = chartPoints.slice(-7).map((point: any) => ({
          value: point.revenue,
          label: format(new Date(point.date), 'dd/MM', { locale: ptBR }),
          labelTextStyle: { color: '#64748b', fontSize: 10 },
          dataPointText: `R$${point.revenue}`,
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, colors }: any) => (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <View style={styles.glowEffect} />
    </LinearGradient>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.date}>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoIcon}>
            <Ionicons name="flash" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="FATURAMENTO"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon="cash-outline"
            colors={['#0ea5e9', '#22d3ee']}
          />
          <StatCard
            title="LUCRO LÍQUIDO"
            value={`R$ ${stats.netProfit.toFixed(2)}`}
            icon="trending-up-outline"
            colors={['#059669', '#10b981']}
          />
          <StatCard
            title="ATENDIMENTOS"
            value={stats.totalAppointments.toString()}
            icon="checkmark-circle-outline"
            colors={['#7c3aed', '#a855f7']}
          />
          <StatCard
            title="CLIENTES"
            value={stats.totalClients.toString()}
            icon="people-outline"
            colors={['#db2777', '#ec4899']}
          />
        </View>

        {chartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>PERFORMANCE FINANCEIRA</Text>
            <Text style={styles.chartSubtitle}>Últimos 7 dias</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={width - 80}
                height={200}
                color="#22d3ee"
                thickness={4}
                startFillColor="rgba(34, 211, 238, 0.4)"
                endFillColor="rgba(34, 211, 238, 0.01)"
                startOpacity={1}
                endOpacity={0.1}
                areaChart
                curved
                dataPointsColor="#22d3ee"
                dataPointsRadius={6}
                dataPointsHeight={6}
                dataPointsWidth={6}
                spacing={50}
                backgroundColor="transparent"
                rulesColor="rgba(255, 255, 255, 0.05)"
                rulesType="solid"
                xAxisColor="rgba(255, 255, 255, 0.1)"
                yAxisColor="rgba(255, 255, 255, 0.1)"
                yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
                hideDataPoints={false}
                showVerticalLines
                verticalLinesColor="rgba(34, 211, 238, 0.05)"
                noOfSections={4}
              />
            </View>
            <View style={styles.chartGlow} />
          </View>
        )}

        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PRÓXIMOS HORÁRIOS</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/agenda')}>
              <Text style={styles.seeAll}>Ver Todos</Text>
            </TouchableOpacity>
          </View>

          {recentAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>Nenhum agendamento para hoje</Text>
            </View>
          ) : (
            recentAppointments.map((apt: any) => (
              <View key={apt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTime}>
                  <Ionicons name="time-outline" size={16} color="#22d3ee" />
                  <Text style={styles.timeText}>{apt.time}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.clientName}>{apt.client_name}</Text>
                  <Text style={styles.serviceName}>
                    {apt.service_name} • R$ {apt.price}
                  </Text>
                </View>
                <View style={styles.statusDot} />
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push('/(tabs)/agenda')}
        >
          <LinearGradient
            colors={['#22d3ee', '#0ea5e9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#0f172a" />
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  logoIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#22d3ee',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 75,
    opacity: 0.3,
  },
  statIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  chartGlow: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: '#22d3ee',
    borderRadius: 150,
    opacity: 0.05,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  appointmentsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  seeAll: {
    fontSize: 14,
    color: '#22d3ee',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.1)',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  timeText: {
    color: '#22d3ee',
    fontWeight: '900',
    marginLeft: 6,
    fontSize: 14,
  },
  appointmentInfo: {
    flex: 1,
  },
  clientName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  serviceName: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});