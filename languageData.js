function getLanguage(moduleName, lan) {
	var data = {};
	if ('module1' == moduleName) {
		data = {
			lab: {
				a: ['Flicker frequency:', '防闪频率:'][lan],
				b: ['WDR:', '宽动态:'][lan],
				c: ['FaceTargetBrightness:', '人脸目标亮度:'][lan],
				d: ['FaceExposureInterval(s):', '人脸曝光间隔(s):'][lan],
				e: ['IlluminationCondition:', '光照条件:'][lan],
				f: ['HLC:', '背光补偿:'][lan]
			},
			sel: {
				g: ['Auto', '自动'][lan],
				h: ['Manual', '手动'][lan]
			}
		}
	}

	return data;

}