import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts"

const axiosInstance = axiod.create()

 axiosInstance.interceptors.request.use(
	(config) => {
		console.log(`Making request to: ${config.url}`)
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

export default axiosInstance
