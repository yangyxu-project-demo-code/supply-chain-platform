var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			info: null,
			details: []
		}
	},
	componentDidMount: function (){
		this.__loadDetailList();
	},
	reset: function (){
		this.setState({
			info: null,
			details: []
		});
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
	__renderTable: function (){
		if(this.state.details){
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
						this.state.details.map(function (item, index){
							this.state.total_count += item.count;
							this.state.total_sum += item.total_sum;
							return <ul key={item.product_model} className="table-row item" >
								<li style={{flex: 1}}>{/*<i className="fa zr-padding-5 fa-trash" />*/}{item.product_title}</li>
								<li style={{flex: 1}}>{item.product_model}</li>
								<li style={{flex: 1}}>{item.count.toFixed(2)}</li>
								<li style={{flex: 1}}>￥{item.total_sum.toFixed(2)}</li>
							</ul>;
						}.bind(this))
					}
					<ul className="table-row item" style={{color: '#03A9F4', backgroundColor: '#fbfbfb', fontWeight: 'bold'}} >
						<li style={{flex: 1}}>汇总：</li>
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
	__renderInfo: function (){
		if(this.state.info){
			return <div className="zn-plugin-admin-base-info">
				<div className="right">

					<div className="item-group">
						<div className="group-title">基本信息</div>
						<div className="item">
							<span className="item-key">发票批次: </span>
							<span className="item-value">{this.state.info.invoice_batch}</span>
						</div>
						<div className="item">
							<span className="item-key">发票编号: </span>
							<span className="item-value">{this.state.info.invoice_no}</span>
						</div>
						<div className="item">
							<span className="item-key">发票标题: </span>
							<span className="item-value">{this.state.info.title}</span>
						</div>
						<div className="item">
							<span className="item-key">开票税号: </span>
							<span className="item-value">{this.state.info.tax_id}</span>
						</div>
						<div className="item">
							<span className="item-key">开票数量: </span>
							<span className="item-value">{this.state.info.count}</span>
						</div>
						<div className="item">
							<span className="item-key">开票金额: </span>
							<span className="item-value">{this.state.info.sum}</span>
						</div>
					</div>
					<div className="item-group">
						<div className="group-title">收件人信息</div>
						<div className="item">
							<span className="item-key">姓名: </span>
							<span className="item-value">{this.state.info.consignee}</span>
						</div>
						<div className="item">
							<span className="item-key">电话: </span>
							<span className="item-value">{this.state.info.consignee_phone}</span>
						</div>
						<div className="item">
							<span className="item-key">地址: </span>
							<span className="item-value">{this.state.info.consignee_address}</span>
						</div>
					</div>
					<div className="item-group">
						<div className="group-title">物流信息</div>
						<div className="item">
							<span className="item-key">快递公司: </span>
							<span className="item-value">{this.state.info.express_company}</span>
						</div>
						<div className="item">
							<span className="item-key">快递单号: </span>
							<span className="item-value">{this.state.info.express_code}</span>
						</div>
						<div className="item">
							<span className="item-key">快递金额: </span>
							<span className="item-value">{this.state.info.express_sum}</span>
						</div>
					</div>
					<div className="item-group">
						<div className="group-title">文件</div>
						<div className="item">
							<span className="item-key">附件: </span>
							<div className></div>
							<div className="item-value">
								<zn.react.Files value={this.state.info.files} />
							</div>
						</div>
					</div>
				</div>
			</div>;
		}
	},
	__renderTableDetail: function (){
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
	__loadDetailList: function (){
		zn.http.post('/oa/invoice/getInvoiceInfo', {
			invoice_id: this.props.invoice_id
		}).then(function (data){
			if(data.status==200){
				this.setState({
					info: data.result.invoice,
					details: data.result.details
				});
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this), function (){
			zn.notification.error('网络加载失败');
		});
	},
	render:function(){
		return (
			<div className="zn-plugin-workflow-wf-my zn-plugin-workflow-instance-flow-table-info oa-admin-user-customer-order-details oa-admin-user-customer-invoice">
				{this.__renderInfo()}
				{this.__renderTable()}
			</div>
		);
	}
});
