const api = uni.getStorageSync('api')
export default {
  // 后端接口host
	api: api || 'http://192.168.0.104:3001'
}