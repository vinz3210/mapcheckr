import { createRouter, createWebHistory } from 'vue-router';
import DateCheckr from '../views/DateCheckr.vue';
import DateTagger from '../views/DateTagger.vue';

const routes = [
  {
    path: '/',
    name: 'DateCheckr',
    component: DateCheckr,
    meta: { title: 'DateCheckr' },
  },
  {
    path: '/datetagger',
    name: 'DateTagger',
    component: DateTagger,
    meta: { title: 'DateTagger' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Update document.title after each navigation based on route meta
router.afterEach((to) => {
  const defaultTitle = 'DateCheckr';
  if (to && to.meta && to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = defaultTitle;
  }
});

export default router;
