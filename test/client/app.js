import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
const routes = [{
	path: '/',
	component: () => import('@/components/home.vue')
}, ];

const router = new VueRouter({ routes })
new Vue({
	el: '#app',
	router: router,
});
