require('./CustomerInvoice.less');
var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			products: null,
			checkeds: [],
			total_count: 0,
			total_sum: 0,
			checked_total_count: 0,
			checked_total_sum: 0
		}
	},
	componentDidMount: function (){
		this.__loadDetailList();
	},
	reset: function (){
		this.setState({
			products: null,
			checkeds: [],
			total_count: 0,
			total_sum: 0,
			checked_total_count: 0,
			checked_total_sum: 0
		});
	},
	__parseData: function (data){
		var _products = [],
			_psn = {};
		this.state.checkeds = [];
		data.forEach(function (item){
			item.product_title = item.product_title || item.product_model;
			if(item.product_model && _psn[item.product_model]){
				_psn[item.product_model].count += +item.count;
				_psn[item.product_model].total_sum += +item.total_sum;
				_psn[item.product_model].order_ids.push(item.id);
			}else {
				if(item.product_model){
					_psn[item.product_model] = {
						order_ids: [ item.id ],
						product_title: item.product_title,
						product_model: item.product_model,
						count: +item.count,
						total_sum: +item.total_sum
					}
				}
			}
		}.bind(this));

		for(var key in _psn){
			_products.push(_psn[key]);
		}

		_products = _products.sort(function(obj1,obj2){
			return obj2.total_sum - obj1.total_sum;     // 升序
		});
		this.state.products = _products;
		this.forceUpdate();
	},
	__onRowCheckChange: function (index, item){
		if(index==-1){
			this.state.checkeds.push(item);
		}else {
			this.state.checkeds.splice(index, 1);
		}
		this.forceUpdate();
	},
	__checkAll: function (checkall){
		if(checkall){
			this.state.checkeds = [];
		}else {
			this.state.checkeds = this.state.products.slice(0);
		}
		this.forceUpdate();
	},
	__renderTable: function (){
		if(this.state.products){
			var _checkall = this.state.products.length==this.state.checkeds.length;
			this.state.total_count = 0;
			this.state.total_sum = 0;
			return (
				<zn.react.Group style={{backgroundColor: '#FFF'}} title="商品详情汇总" className="table">
					<ul className="table-row header">
						{
							['商品名称', '型号', '总数', '总金额'].map(function (item, index){
								return <li style={{flex: 1}}><span>{item}</span></li>;
							})
						}
					</ul>
					{
						this.state.products.map(function (item, index){
							var _value = null,
								_index = this.state.checkeds.indexOf(item);
							this.state.total_count += item.count;
							this.state.total_sum += item.total_sum;
							return <ul key={item.product_model} className="table-row item" style={{color: (_index!=-1?'#e81d0e':'#6d6868')}} onClick={()=>this.__onRowCheckChange(_index, item)} >
								{
									Object.keys(item).map(function (key, index){
										_value = item[key];
										if(key=='order_ids'){
											return null;
										}
										if(key=='total_sum'){
											_value = '￥' + _value.toFixed(2);
										}

										if(key=='product_title'){
											_value = <span><i className={"fa zr-padding-5 " + (_index!=-1?'fa-check-circle':'fa-check-circle-o')} />{_value}</span>;
										}
										return <li style={{flex: 1}}><span>{_value}</span></li>;
									}.bind(this))
								}
							</ul>;
						}.bind(this))
					}
					<ul className="table-row item" style={{color: (_checkall?'#e81d0e':'#6d6868'), backgroundColor: '#fbfbfb', fontWeight: 'bold'}} >
						<li style={{flex: 1}} onClick={()=>this.__checkAll(_checkall)}><i className={"fa zr-padding-5 " + (_checkall?'fa-check-circle':'fa-check-circle-o')} />全选</li>
						<li style={{flex: 1}}></li>
						<li style={{flex: 1}}>{this.state.total_count}</li>
						<li style={{flex: 1}}>￥{this.state.total_sum.toFixed(2)}</li>
					</ul>
				</zn.react.Group>
			);
		}else {
			return <zn.react.DataLoader loader="timer" content="正在加载中..." />;
		}
	},
	__onRemoveItem: function (item){
		this.state.checkeds.splice(this.state.checkeds.indexOf(item), 1);
		this.forceUpdate();
	},
	__createInvoice: function (){
		var _self = this;
		if(window.confirm('待开票的订单一旦开票成功将会被系统锁住, 确定开票吗？')){
			zn.http.post('/oa/invoice/createInvoice', {
				customer: this.props.customer,
				count: this.state.checked_total_count,
				sum: this.state.checked_total_sum,
				data: this.state.checkeds
			}).then(function (data){
				if(data.status==200){
					zn.notification.success('开票成功！');
					_self.__loadDetailList();
				}else {
					zn.notification.error(data.result);
				}
			}, function (){
				zn.notification.error('网络请求失败');
			});
		}
	},
	__renderCheckedTable: function (){
		if(this.state.checkeds.length){
			this.state.checked_total_sum = 0;
			this.state.checked_total_count = 0;
			return <zn.react.Group style={{backgroundColor: '#FFF'}} title="已选且待开票商品列表" className="table">
				<ul className="table-row header">
					{
						['商品名称', '型号', '总数', '总金额'].map(function (item, index){
							return <li style={{flex: 1}}><span>{item}</span></li>;
						})
					}
				</ul>
				{
					this.state.checkeds.map(function (item, index){
						var _value = null;
						this.state.checked_total_sum += item.total_sum;
						this.state.checked_total_count += item.count;
						return <ul key={item.product_model} className="table-row item" style={{color: 'green'}} >
							{
								Object.keys(item).map(function (key, index){
									_value = item[key];
									if(key=='order_ids'){
										return null;
									}
									if(key=='total_sum'){
										_value = '￥' + _value.toFixed(2);
									}
									if(key=='product_title'){
										_value = <span>
											<i onClick={()=>this.__onRemoveItem(item)} data-tooltip="移除" className="fa fa-trash zr-padding-5" style={{cursor: 'pointer'}} />
											{_value}
										</span>;
									}
									return <li style={{flex: 1}}><span>{_value}</span></li>;
								}.bind(this))
							}
						</ul>
					}.bind(this))
				}
				<ul className="table-row item" style={{color: '#e81d0e', backgroundColor: '#fbfbfb', fontWeight: 'bold'}} >
					<li style={{flex: 1}}><span onClick={()=>this.__createInvoice()} className="zr-tag danger"><i className="fa fa-wpforms zr-padding-3" />一键开票</span></li>
					<li style={{flex: 1}}>汇总：</li>
					<li style={{flex: 1}}>{this.state.checked_total_count}</li>
					<li style={{flex: 1}}>￥{this.state.checked_total_sum.toFixed(2)}</li>
				</ul>
			</zn.react.Group>;
		}
	},
	__loadDetailList: function (begin, end){
		zn.http.post('/oa/customer/getSaleOrders', {
			customer: this.props.customer,
			begin: begin,
			end: end
		}).then(function (data){
			if(data.status==200){
				this.__parseData(data.result);
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this), function (){
			zn.notification.error('网络加载失败');
		});
	},
	__search: function (){
		var _begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadDetailList(_begin, _end);
	},
	render:function(){
		return (
			<div className="zn-plugin-workflow-wf-my zn-plugin-workflow-instance-flow-table-info oa-admin-user-customer-order-details oa-admin-user-customer-invoice">
				<zn.react.Group title="高级查询" className="page-title" style={{backgroundColor: '#FFF'}}>
					<div className="_item">
						<span className="_key">开始时间：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.DateTime ref="begin_time" />
						</div>
					</div>
					<div className="_item">
						<span className="_key">截止时间：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.DateTime ref="end_time" style={{margin: 5}} />
							<zn.react.Button onClick={this.__search} text="查询" status="warning" icon="fa-search" style={{width: 100, marginLeft: 20}} />
						</div>
					</div>
				</zn.react.Group>
				{this.__renderTable()}
				{this.__renderCheckedTable()}
			</div>
		);
	}
});
