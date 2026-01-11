import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function TasksScreen() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await api.post('/tasks', { title: newTaskTitle, priority: 'normal' });
      setNewTaskTitle('');
      setIsAdding(false);
      loadTasks();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar tarefa');
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      await api.put(`/tasks/${id}/toggle`);
      loadTasks();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar tarefa');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao excluir tarefa');
    }
  };

  const renderTask = ({ item }: any) => (
    <View style={[styles.taskCard, item.done && styles.taskCardDone]}>
      <TouchableOpacity
        style={[styles.checkbox, item.done && styles.checkboxDone]}
        onPress={() => handleToggleTask(item.id)}
      >
        {item.done && <Ionicons name="checkmark" size={18} color="#0f172a" />}
      </TouchableOpacity>
      <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>
        {item.title}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#64748b" />
      </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.title}>Tarefas</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)}>
          <Ionicons name="add-circle" size={32} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nova tarefa..."
            placeholderTextColor="#475569"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
            autoFocus
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Ionicons name="checkmark" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      )}

      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-outline" size={64} color="#334155" />
          <Text style={styles.emptyText}>Nenhuma tarefa pendente</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  addContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    backgroundColor: '#22d3ee',
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
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
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskCardDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  taskTitleDone: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
});