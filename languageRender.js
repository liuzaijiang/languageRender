(function() {

	function languageRender(option) {
		this.option = option;
		this.data = option.data;
		this.beforeRender = option.beforeRender || function() {};
		//判断el是否是数组，即判断是否需要渲染多个包裹元素下的dom
		if (Object.prototype.toString.call(option.el) == '[object Array]') {
			this.elArray = option.el;
		} else {
			this.el = document.getElementById(option.el);
		}
		this.beforeRender();
		this.render();
	}

	languageRender.prototype = {
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
					var _attrName = attrName.slice(4);
					var _attrValueArray = attrValue.split('.');
					var len = _attrValueArray.length;

					if (len > 1) { //说明有对象嵌套例如a.b
						dataValue = self.data;
						for (var j = 0; j < len; j++) {
							dataKey = _attrValueArray[j];
							dataValue = dataValue[dataKey];
						}
					} else {
						dataValue = self.data[attrValue];
					}

					if ('text' == _attrName) { //inf-text为设置改节点内包含的文本节点值,类比jq的$().text
						if (node.textContent != undefined) {
							node.textContent = dataValue;
						} else {
							node.innerText = dataValue; //IE8
						}
					} else {
						self.updateStyle(node, _attrName, dataValue);
					}
					node.removeAttribute(attrName);
				}
			}
		},
		updateStyle: function(node, attr, val) {
			if ('class' == attr) {
				if (node.classList) {
					node.classList['add'](val);
				} else { //兼容IE8
					node.className += ' ' + val;
				}
			} else {
				node.setAttribute(attr, val);
			}
		},
		isElementNode: function(node) {
			return node.nodeType == 1;
		},
		isDirective: function(attr) {
			return attr.indexOf('inf-') == 0;
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

	languageRender.prototype.constructor = languageRender;
	window.languageRender = languageRender;

})()