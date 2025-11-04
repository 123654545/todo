import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import TodoList from '../views/TodoList.vue'
import Calendar from '../views/Calendar.vue'
import Profile from '../views/Profile.vue'
import AllTasks from '../views/AllTasks.vue'
import CompletedTasks from '../views/CompletedTasks.vue'
import OverdueTasks from '../views/OverdueTasks.vue'
import Statistics from '../views/Statistics.vue'
import InProgressTasks from '../views/InProgressTasks.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/todos',
    name: 'TodoList',
    component: TodoList
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/all-tasks',
    name: 'AllTasks',
    component: AllTasks
  },
  {
    path: '/completed-tasks',
    name: 'CompletedTasks',
    component: CompletedTasks
  },
  {
    path: '/overdue-tasks',
    name: 'OverdueTasks',
    component: OverdueTasks
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics
  },
  {
    path: '/in-progress-tasks',
    name: 'InProgressTasks',
    component: InProgressTasks
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router