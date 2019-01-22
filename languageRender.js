(function() {

	function languageRender(option) {
		this.option = option;
		this.lan = option.lan;
		this.beforeRender = option.beforeRender || function() {};
		//判断el是否是数组，即判断是否需要渲染多个包裹元素下的dom
		if (Object.prototype.toString.call(option.el) == '[object Array]') {
			this.elArray = option.el;
		} else {
			this.el = document.getElementById(option.el);
		}
		this.dep = new Dep();
		this.beforeRender();
		this.dataInit();
		this.render();
	}

	languageRender.prototype = {
		//由于传进来的文字信息是数组，所以这里需要对数组根据this.lan值进行选择语言，并赋值给this.data
		dataInit: function() {
			var o = JSON.parse(JSON.stringify(this.option.data)); //深拷贝对象，避免污染变量，方便后面切换中英文使用
			this.dataProcessing(o);
			this.data = o;
		},
		dataProcessing: function(data) {
			for (key in data) {
				var item = data[key];
				if (Object.prototype.toString.call(item) == '[object Array]') {
					data[key] = item[this.lan];

				} else if (Object.prototype.toString.call(item) == '[object Object]') {
					this.dataProcessing(item);
				}
			}
		},
		render: function() {
			if (this.elArray) {
				for (var i = 0; i < this.elArray.length; i++) {
					var el = document.getElementById(this.elArray[i]);
					if (el) {
						this.init(el);
					}
				}
			} else if (this.el) {
				this.init(this.el);
			}
		},
		init: function(el) {
			this.fragment = this.nodeToFragment(el); //将el内的元素临时放入fragment中
			this.compileNode(this.fragment); //对fragment中的元素进行解析
			el.appendChild(this.fragment); //将fragment中的元素重新渲染到页面上
		},
		nodeToFragment: function(el) {
			var fragmentWrapper = document.createElement("div");
			var child = el.firstChild;
			while (child) { //遍历el内的元素
				// 将Dom元素移入fragment中，由于dom是传址，所以页面上的dom会消失，临时转移到创建的fragmentWrapper中，为了兼容IE8只能创建一个div
				fragmentWrapper.appendChild(child);
				child = el.firstChild;
			}
			return fragmentWrapper;
		},
		compileNode: function(el) {
			//childNodes是获取dom节点，不光光是html元素节点，还包括了获取文本节点
			//childNodes只是一个类集合，不是数组，需要进行转换
			var childNodes = convertListToArray(el.childNodes);
			for (var i = childNodes.length - 1; i >= 0; i--) {
				var self = this;
				var node = childNodes[i];

				if (self.isElementNode(node)) { //处理元素节点
					self.complieElement(node);
				}

				//处理子节点，递归
				if (node.childNodes && node.childNodes.length) {
					self.compileNode(node);
				}
			}
		},
		complieElement: function(node) {
			var nodeAttrs = convertListToArray(node.attributes);
			for (var i = nodeAttrs.length - 1; i >= 0; i--) {
				var attr = nodeAttrs[i];
				var attrName = attr.name;
				var attrValue = attr.value;
				var dataKey;
				var dataValue;
				var self = this;
				if (self.isDirective(attrName)) { //判断是否是自定义属性 inf-开头
					/*例如:
					inf-text='lab.name'  lab:{name:'liuzj'}
					attrName为inf-text
					attrValue为lab.name
					_attrName为text
					dataKey为lab->name
					dataValue为liuzj
					*/

					var _attrName = attrName.slice(4);
					var _attrValueArray = attrValue.split('.');
					var len = _attrValueArray.length;
					dataValue = self.data;
					for (var j = 0; j < len; j++) {
						dataKey = _attrValueArray[j];
						dataValue = dataValue[dataKey];
					}
					if ('text' == _attrName) { //inf-text为设置改节点内包含的文本节点值,类比jq的$().text
						self.updateText(node, attrValue, dataValue)
					} else {
						self.updateStyle(node, _attrName, attrValue, dataValue);
					}
					node.removeAttribute(attrName);
				}
			}
		},
		updateText: function(node, attrValue, text) {
			this.updateTextCallBack(node, attrValue, text);
			new Watcher(this, attrValue, function(value) {
				this.updateTextCallBack(node, attrValue, value);
			});

		},
		//将对node的具体操作单独作为一个callback拿出来，避免多次new Watcher，每一个自定义属性只new一个Watcher
		updateTextCallBack: function(node, attrValue, text) {
			if (node.textContent != undefined) {
				node.textContent = text;
			} else {
				node.innerText = text; //兼容IE8
			}
		},

		updateStyle: function(node, attr, key, val) {
			this.updateStyleCallBack(node, attr, key, val);
			new Watcher(this, key, function(value, oldValue) {
				this.updateStyleCallBack(node, attr, key, value, oldValue);
			});

		},
		updateStyleCallBack: function(node, attr, key, val, oldValue) {
			if ('class' == attr) {
				if (node.classList) {
					node.classList['add'](val);
					node.classList['remove'](oldValue);
				} else { //兼容IE8
					node.className = node.className.replace(oldValue, '');
					node.className += ' ' + val;
				}
			} else {
				node.setAttribute(attr, val);

			}
		},
		//判断是否是元素节点
		isElementNode: function(node) {
			return node.nodeType == 1;
		},
		//判断是否是自定义属性，即指令
		isDirective: function(attr) {
			return attr.indexOf('inf-') == 0;
		},
		//单独修改某个数据所提供的接口,例如languageRenderCtx.set('languageData.lab.a','xxx');
		set: function(key, val) {
			var keyArray = key.split('.');
			var data = this.data;
			for (var i = 0; i < keyArray.length; i++) {
				if (i < keyArray.length - 1) {
					data = data[keyArray[i]];
				} else {
					data[keyArray[i]] = val;
				}
			}
			this.dep.notify();
		},
		//修改全部语言选择所提供的接口 lan:0英文 lan:1中文
		setLan: function(lan) {
			if (this.lan == lan) {
				return
			}
			this.lan = lan;
			this.dataInit();
			this.dep.notify();
		}
	}

	//将nodeList转换为数组，兼容IE8
	function convertListToArray(nodes) {
		var array = null;
		try {
			array = Array.prototype.slice.call(nodes, 0);
		} catch (ex) {
			array = new Array();
			for (var i = 0, len = nodes.length; i < len; i++) {
				array.push(nodes[i]);
			}
		}
		return array;
	}

	// 消息订阅器Dep，订阅器Dep主要负责收集订阅者，然后再属性变化的时候执行对应订阅者的更新函数
	function Dep() {
		this.subs = [];
	}

	Dep.prototype = {
		addSub: function(sub) {
			this.subs.push(sub);
		},
		// 通知订阅者数据变更
		notify: function() {
			for (var i = 0; i < this.subs.length; i++) {
				this.subs[i].update();
			}
		}
	};

	//订阅者Watcher，每一个节点上的每一个自定义属性就是一个订阅者，等待Dep通知，执行cb从而更新ui
	function Watcher(languageRenderCtx, key, cb) {
		this.languageRenderCtx = languageRenderCtx;
		this.cb = cb;
		this.key = key;
		this.value = this.get();
		this.languageRenderCtx.dep.addSub(this);
	}

	Watcher.prototype = {
		update: function() {
			this.run();
		},
		run: function() {
			var value = this.get();
			var oldVal = this.value;
			if (value !== oldVal) {
				this.value = value;
				this.cb.call(this.languageRenderCtx, value, oldVal);
			}
		},
		get: function() {
			var keyArray = this.key.split('.')
			var value = this.languageRenderCtx.data;
			for (var i = 0; i < keyArray.length; i++) {
				value = value[keyArray[i]]
			}
			return value;
		}
	};


	languageRender.prototype.constructor = languageRender;
	window.languageRender = languageRender;

})()