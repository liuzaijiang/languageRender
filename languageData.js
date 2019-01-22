function getLanguage(moduleName) {
	var data = {};
	if ('module1' == moduleName) {
		data = {
			lab: {
				a: ['Flicker frequency:', '防闪频率:'],
				b: ['WDR:', '宽动态:'],
				c: ['FaceTargetBrightness:', '人脸目标亮度:'],
				d: ['FaceExposureInterval(s):', '人脸曝光间隔(s):'],
				e: ['IlluminationCondition:', '光照条件:'],
				f: ['HLC:', '背光补偿:']
			},
			sel: {
				g: ['Auto', '自动'],
				h: ['Manual', '手动']
			}
		}
	}
	return data;

}