require('./CustomerOrderDetails.less');
var React = require('react');

var INVOICE_STATUS = [{text:'待开(未开)', value: 0}, {text: '处理中...', value: 1}, {text:'已开', value: 2}];

var OrderDetail = React.createClass({
	getInitialState: function (){
		return {
			active: false
		}
	},
	__renderStatus: function (value){
		switch (value) {
			case 1:
				return <span className="status" style={{backgroundColor: '#f0ad4e', color: '#FFF'}}>待处理</span>;
			case -1:
				return <span className="status" style={{backgroundColor: '#6def55', color: '#FFF'}}>已结束</span>;
			case -2:
				return <span className="status" style={{backgroundColor: '#dad8d8', color: '#FFF'}}>已取消</span>;
			case 2:
				return <span className="status" style={{backgroundColor: '#0d8c06', color: '#FFF'}}>已审核</span>;
		}
	},
	__invoiceStatus: function (value){
		switch (value.receipt_invoice_status) {
			case 0:
				return <span className="status" style={{backgroundColor: '#f0ad4e', color: '#FFF'}}><i className="fa fa-edit zr-padding-3" onClick={(event)=>this.__editInvoice(value)} data-tooltip="编辑开票信息" />待开(未开)</span>;
			case 1:
				return <span className="status" style={{backgroundColor: '#0d8c06', color: '#FFF'}}><i className="fa fa-edit zr-padding-3" onClick={(event)=>this.__editInvoice(value)} data-tooltip="编辑开票信息" />处理中...</span>;
			case 2:
				return <span className="status" style={{backgroundColor: '#6def55', color: '#FFF'}}><i className="fa fa-eye zr-padding-3" onClick={(event)=>this.__editInvoice(value, true)} data-tooltip="查看开票信息" />已开</span>;
			case -1:
				return <span className="status" style={{backgroundColor: '#dad8d8', color: '#FFF'}}>已关闭</span>;

		}
	},
	__editInvoice: function (data, readonly){
		zn.dialog({
			title: '编辑开票信息',
			content: <zn.react.Form
				action='/zn.plugin.admin/table/update'
				exts={{table: "zn_workflow_stock_sale_receipt", where: { id: data.receipt_id }}}
				merge="updates"
				readonly={readonly}
				onSubmitSuccess={()=>{this.props.onInvoiceSuccess && this.props.onInvoiceSuccess()}}
				items={[
					{ title: '开票状态', name: 'invoice_status', value: data.receipt_invoice_status, type: 'Select', data: [{text: '处理中...', value: 1}, {text:'已开', value: 2}] },
					{ title: '发票号', name: 'invoice_number', value: data.receipt_invoice_number, type: 'Input' },
					{ title: '发票附件', name: 'invoice_attachments', value: data.receipt_invoice_attachments, type: 'FileUploader' },
					{ title: '开票备注', name: 'invoice_note', value: data.receipt_invoice_note, type: 'Textarea' }
				]} />
		});
	},
	render: function (){
		var order = this.props.order;
		var _details = this.props.details;
		return (
			<div className="detail">
				<div className="title" onClick={()=>this.setState({ active: !this.state.active })}>
					<div><a style={{ backgroundColor:'#f3eaea', padding: 5, marginRight: 5 }}>开票状态：{this.__invoiceStatus(order)}</a>订单编号 <a data-tooltip="流程详情" href={'#'+zn.react.session.fixPath('/znpluginworkflow.wfinstance')+'?instanceId=' + order.wfi_id}>{order.code}</a></div>
					<span>{order.zn_create_time} {this.__renderStatus(order.state)} <i style={{width: 16, textAlign: 'center'}} className={"fa zr-padding-3 fa-"+(this.state.active?'angle-down':'angle-right')} /></span>
				</div>
				<div className="table" style={{display: (this.state.active?'block':'none')}}>
					<ul className="table-row header">
						{
							['订单号', '收件人', '地址', '电话', '手机号', '产品型号', '数量', '单价', '总金额', '快递金额', '出库仓'].map(function (item, index){
								return <li><span>{item}</span></li>;
							})
						}
					</ul>
					{
						_details[order.receipt_id] && _details[order.receipt_id].map(function (item, index){
							return <ul className="table-row item">
								{
									['order_code', 'consignee', 'address', 'consignee_telephone', 'consignee_phone', 'product_model','count', 'price', 'total_sum','express_sum', 'out_warehouse_convert'].map(function (key, index){
										return <li data-tooltip={item[key]}><span>{item[key]}</span></li>;
									})
								}
							</ul>
						})
					}
				</div>
				<div className="summary">
					<div></div>
					<div>总价：￥{(this.props.prices[order.receipt_id]||0).toFixed(2)}</div>
				</div>
				{
					order.zn_note && <div className="zn-note">
						<div className="title">备注：</div>
						<div className="content">{order.zn_note}</div>
					</div>
				}
			</div>
		);
	}
});

module.exports = React.createClass({
	getInitialState: function () {
		return {
			status: 0,
			orders: null,
			details: null,
			total_count: 0,
			total_total_sum: 0,
			total_express_sum: 0
		}
	},
	componentDidMount: function (){
		this.__loadData();
	},
	__parseData: function (data){
		var _ids_obj = {},
			_id_price = {},
			_state = { orders: data.orders };
		this.state.total_count = 0;
		this.state.total_express_sum = 0;
		this.state.total_total_sum = 0;
		data.orderdetails.map(function (detail){
			if(!_ids_obj[detail.zn_plugin_workflow_primary_id]){
				_ids_obj[detail.zn_plugin_workflow_primary_id] = [];
				_id_price[detail.zn_plugin_workflow_primary_id] = 0;
			}
			_ids_obj[detail.zn_plugin_workflow_primary_id].push(detail);
			_id_price[detail.zn_plugin_workflow_primary_id] += +detail.total_sum;
			this.state.total_count += +detail.count;
			this.state.total_express_sum += +detail.express_sum;
			this.state.total_total_sum += +detail.total_sum;
		}.bind(this));
		if(data.orders.length){
			_state.title = data.orders[0].customer_convert;
		}
		_state.details = _ids_obj;
		_state.prices = _id_price;
		this.setState(_state);
	},
	__loadData: function (status, begin, end){
		this.state.status = status==null?this.state.status:status;
		this.state.begin = begin==null?this.state.begin:begin;
		this.state.end = end==null?this.state.end:end;
		zn.preloader.open({
			title: '加载中...'
		});
		zn.http.post('/oa/customer/order_details', {
			customer: this.props.customer,
			status: this.state.status,
			begin: this.state.begin,
			end: this.state.end
		}).then(function (data){
			zn.preloader.close();
			if(data.status==200){
				this.__parseData(data.result);
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this), function (){
			zn.preloader.close();
			zn.notification.error('网络请求失败');
		});
	},
	__search: function (){
		var _status = this.refs.invoice_status.getValue(),
			_begin = this.refs.invoice_begin_time.getValue(),
			_end = this.refs.invoice_end_time.getValue();
		this.__loadData(_status, _begin, _end);
	},
	__generateStatement: function (){

	},
	render:function(){
		var _details = this.state.details;
		return (
			<div className="oa-admin-user-customer-order-details">
				<zn.react.Group title="过滤" className="page-title">
					<div className="_item">
						<span className="_key">发票状态：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Select value={0} ref="invoice_status" data={INVOICE_STATUS} />
						</div>
					</div>
					<div className="_item">
						<span className="_key">截止时间：</span>
						<div className="_value" style={{display:'flex', alignItems: 'center'}}>
							<zn.react.Input ref="invoice_begin_time" attrs={{type:'date'}} />
							<span style={{margin: 5}}>--</span>
							<zn.react.Input ref="invoice_end_time" attrs={{type:'date'}}  style={{margin: 5}} />
							<zn.react.Button onClick={this.__search} text="查询" status="warning" icon="fa-search" style={{width: 100}} />
							<zn.react.Button onClick={this.__generateStatement} text="生成对账单" status="primary" icon="fa-file-text-o " style={{marginLeft: 10, width: 100}} />
						</div>
					</div>
				</zn.react.Group>
				<div className="zr-number-row">
					<div className="col-item number-item">
						<div className="value">
							<div className="detail">
								<div className="count">{this.state.total_count}</div>
								<div className="tip">发件总量</div>
							</div>
							<i className="fa fa-align-justify icon" />
						</div>
					</div>
					<div className="col-item number-item">
						<div className="value">
							<div className="detail">
								<div className="count">￥ {this.state.total_total_sum.toFixed(2)}</div>
								<div className="tip">商品总价</div>
							</div>
							<i className="fa fa icon" />
						</div>
					</div>
					<div className="col-item number-item">
						<div className="value">
							<div className="detail">
								<div className="count">￥ {this.state.total_express_sum.toFixed(2)}</div>
								<div className="tip">物流总额</div>
							</div>
							<i className="fa fa icon" />
						</div>
					</div>
				</div>
				<div className="page-details">
					{
						this.state.orders && this.state.orders.map(function (order) {
							return <OrderDetail onInvoiceSuccess={()=>this.__loadData()} order={order} details={_details} prices={this.state.prices} />;
						}.bind(this))
					}
				</div>
			</div>
		);
	}
});
