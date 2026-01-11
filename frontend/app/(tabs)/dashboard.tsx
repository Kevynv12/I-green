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

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    totalClients: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [chartData, setChartData] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get appointments for today
      const appointmentsRes = await api.get(`/appointments?date=${today}&status=confirmed`);
      setRecentAppointments(appointmentsRes.data.slice(0, 5));

      // Get analytics
      const analyticsRes = await api.get('/analytics/financial');
      setStats({
        totalRevenue: analyticsRes.data.total_revenue || 0,
        totalAppointments: analyticsRes.data.total_appointments || 0,
        totalClients: 0,
      });

      // Prepare chart data
      const chartPoints = analyticsRes.data.chart_data || [];
      if (chartPoints.length > 0) {
        const formattedData = chartPoints.slice(-7).map((point: any) => ({
          value: point.revenue,
          label: format(new Date(point.date), 'dd/MM', { locale: ptBR }),
        }));
        setChartData(formattedData);
      }

      // Get clients count
      const clientsRes = await api.get('/clients');
      setStats(prev => ({ ...prev, totalClients: clientsRes.data.length }));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.date}>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={24} color="#fff" />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Faturamento"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon="cash-outline"
            color="#22d3ee"
          />
          <StatCard
            title="Atendimentos"
            value={stats.totalAppointments.toString()}
            icon="checkmark-circle-outline"
            color="#10b981"
          />
          <StatCard
            title="Clientes"
            value={stats.totalClients.toString()}
            icon="people-outline"
            color="#a855f7"
          />
        </View>

        {/* Chart */}
        {chartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Performance Financeira</Text>
            <LineChart
              data={chartData}
              width={width - 64}
              height={180}
              color="#22d3ee"
              thickness={3}
              startFillColor="rgba(34, 211, 238, 0.3)"
              endFillColor="rgba(34, 211, 238, 0.01)"
              startOpacity={0.9}
              endOpacity={0.2}
              areaChart
              hideDataPoints={false}
              dataPointsColor="#22d3ee"
              dataPointsRadius={4}
              spacing={40}
              backgroundColor="transparent"
              rulesColor="rgba(255, 255, 255, 0.1)"
              rulesType="solid"
              xAxisColor="rgba(255, 255, 255, 0.1)"
              yAxisColor="rgba(255, 255, 255, 0.1)"
              yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#64748b', fontSize: 10 }}
            />
          </View>
        )}

        {/* Today's Appointments */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Horários</Text>
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
                  <Text style={styles.timeText}>{apt.time}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.clientName}>{apt.client_name}</Text>
                  <Text style={styles.serviceName}>
                    {apt.service_name} • R$ {apt.price}
                  </Text>
                </View>
                <View style={styles.appointmentStatus}>
                  <View style={[styles.statusDot, { backgroundColor: '#22d3ee' }]} />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/agenda')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#22d3ee" />
            <Text style={styles.actionText}>Novo Agendamento</Text>
          </TouchableOpacity>
        </View>
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
  greeting: {
    fontSize: 28,
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
    width: 48,
    height: 48,
    backgroundColor: '#22d3ee',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appointmentTime: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  timeText: {
    color: '#22d3ee',
    fontWeight: '900',
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
  appointmentStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActions: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  actionText: {
    color: '#22d3ee',
    fontWeight: '900',
    fontSize: 16,
    marginLeft: 12,
  },
});