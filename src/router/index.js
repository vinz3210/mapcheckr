import { createRouter, createWebHistory } from 'vue-router';
import DateCheckr from '../views/DateCheckr.vue';
import DateTagger from '../views/DateTagger.vue';

const routes = [
  {
    path: '/',
    name: 'DateCheckr',
    component: DateCheckr,
  },
  {
    path: '/datetagger',
    name: 'DateTagger',
    component: DateTagger,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
