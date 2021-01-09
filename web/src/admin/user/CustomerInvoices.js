var React = require('react');
var CustomerInvoiceInfo = require('./CustomerInvoiceInfo.js');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/invoice/pagingInvoices', {
				customer_id: this.props.customer
			}),
			items: [
				{ title: '操作', name: 'action', width: 220 },
				{ title: '操作时间', name: 'zn_create_time', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '对公客户', name: 'customer', width: 240 },
				{ title: '发票批次', name: 'invoice_batch', width: 180, filter: { type: 'Input', opts: ['like'] } },
				{ title: '发票编号', name: 'invoice_no', width: 180, filter: { type: 'Input', opts: ['like'] } },
				{ title: '发票标题', name: 'title', width: 240 , filter: { type: 'Input', opts: ['like'] }},
				{ title: '发票税号', name: 'tax_id', width: 120, filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '金额', name: 'sum', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '开票时间', name: 'invoice_create_time', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收件人', name: 'consignee', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '手机号', name: 'consignee_phone', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '地址', name: 'consignee_address', width: 100, filter: { type: 'Input', opts: ['like'] } },
				{ title: '快递公司', name: 'express_company', width: 120, filter: { type: 'Input', opts: ['like'] } },
				{ title: '快递单号', name: 'express_code', width: 180, filter: { type: 'Input', opts: ['like'] } },
				{ title: '快递费', name: 'express_sum', width: 100 },
				{ title: '快递状态', name: 'express_state', width: 120 },
				{ title: '备注', name: 'zn_note', width: 400 }
			],
			formItems: [
				{ title: '发票批次', name: 'invoice_batch', type: 'Input', required: true },
				{ title: '发票编号', name: 'invoice_no', type: 'Input', required: true },
				{ title: '发票标题', name: 'title', type: 'Input', required: true },
				{ title: '发票税号', name: 'tax_id', type: 'Input', required: true },
				{ title: '数量', name: 'count', type: 'Input', attrs: {type: 'number'}, required: true },
				{ title: '金额', name: 'sum', type: 'Input', attrs: {type: 'number'}, required: true },
				{ title: '开票时间', name: 'invoice_create_time', type: 'Input', attrs: {type:'date'}, required: true },
				{ title: '收件人', name: 'consignee', type: 'Input' },
				{ title: '手机号', name: 'consignee_phone', type: 'Input' },
				{ title: '地址', name: 'consignee_address', type: 'Textarea' },
				{ title: '附件', name: 'files', type: 'FileUploader' },
				{ title: '备注', name: 'zn_note', type: 'Textarea' }
			]
		}
	},
	__doSuccess: function (){
		this.state.data.refresh();
	},
	__trashItem: function (data){
		var _self = this;
		zn.confirm('作废发票, 该发票将不可恢复, 确定作废？','提示', function (){
			zn.http.post('/oa/invoice/trashInvoice', {
				invoice_id: data.id
			}).then(function (data){
				if(data.status==200){
					zn.notification.success('作废成功！');
					_self.state.data.refresh()
				}else {
					zn.notification.error(data.result);
				}
			}, function (){
				zn.notification.error('网络请求失败');
			});
		});
	},
	__updateExpress: function (data){
		zn.dialog({
			title: '更新物流/快递信息',
			content: <div>
				<div className="zn-note" style={{margin: 6}}>注：更新完快递单号, 需要重新更新快递物流信息。</div>
				<zn.react.Form
					action='/zn.plugin.admin/table/update'
					exts={{ table: 'zn_chunrui_oa_customer_invoice', where: { id: data.id } }}
					merge="updates"
					hiddens={{ express_state: -1, express_data: '{}' }}
					value={data}
					onSubmitSuccess={()=>this.state.data.refresh()}
					items={[
						{title: '快递公司', type: 'Input', required: true, name: 'express_company' },
						{title: '快递单号', type: 'Input', required: true, name: 'express_code' },
						{title: '快递费', type: 'Input', name: 'express_sum', attrs: {type: 'number'}, suffix: '人民币' },
						{title: '备注', type: 'Textarea', name: 'zn_note' }
					]} />
			</div>
		});
	},
	__refreshExpress: function (data){
		zn.preloader.open({title: '正在刷新中...'});
		zn.http.post('/oa/invoice/updateInvoiceExpressInfo', {
			invoice_id: data.id
		}).then(function (data){
			if(data.status==200){
				zn.notification.success('刷新成功！');
				this.state.data.refresh()
			}else {
				zn.notification.error(data.result);
			}
			zn.preloader.close();
		}.bind(this), function (){
			zn.notification.error('网络请求失败');
			zn.preloader.close();
		});
	},
	__showExpressDetail: function (data){
		zn.dialog({
			title: data.express_company + ' - ' + data.express_code + ' 物流详情',
			content: <zn.react.ExpressDetail {...JSON.parse(data.express_data)} />
		});
	},
	__viewInvoiceDetail: function (data){
		zn.dialog({
			title: data.invoice_no + ' 发票详情',
			content: <CustomerInvoiceInfo invoice_id={data.id} />
		});
	},
	__updateRow: function (data){
		zn.dialog({
			title: '更新信息',
			content: <zn.react.Form
				merge="updates"
				action='/zn.plugin.admin/table/update'
				exts={{ table: 'zn_chunrui_oa_customer_invoice', where: {id: data.id} }}
				value={zn.store.post('/zn.plugin.admin/table/selectOne', { table: 'zn_chunrui_oa_customer_invoice', where: {id: data.id} })}
				onSubmitSuccess={this.__doSuccess}
				items={this.state.formItems} />
		});
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		switch (item.name) {
			case 'consignee':
				var _info = data.consignee + '  ' + data.consignee_phone + '  ' + data.consignee_address;
				return <span><i data-tooltip="复制收货人信息" onClick={()=>zn.react.copyToClipboard(_info)} className="fa fa-copy zr-padding-3" />{value}</span>;
			case 'action':
				switch (data.status) {
					case -1:
						return <div style={{textAlign: 'center'}}>
							<span className="zr-tag disabled" ><i className="fa fa-ban zr-padding-3" />已作废</span>
							<span onClick={()=>this.__viewInvoiceDetail(data)} className="zr-tag primary" ><i className="fa fa-info zr-padding-3" />开票详情</span>
							<span onClick={()=>this.__updateRow(data)} className="zr-tag danger"><i className="fa fa-edit zr-padding-3" />更新</span>
						</div>;
					case 0:
						return <div style={{textAlign: 'center'}}>
							<span onClick={()=>this.__trashItem(data)} className="zr-tag danger" ><i className="fa fa-trash zr-padding-3" />作废发票</span>
							<span onClick={()=>this.__viewInvoiceDetail(data)} className="zr-tag primary" ><i className="fa fa-info zr-padding-3" />开票详情</span>
							<span onClick={()=>this.__updateRow(data)} className="zr-tag danger"><i className="fa fa-edit zr-padding-3" />更新</span>
						</div>;
				}
			case 'count':
			case 'sum':
				return <a>{value.toFixed(2)}</a>;
			case 'express_code':
				return <span onClick={()=>this.__updateExpress(data)} className="zr-tag danger" ><i className="fa fa-edit zr-padding-3" />修改 {value}</span>;
			case 'express_state':
				if(!data.express_code){
					return <span className="zr-tag" >待上传单号</span>;
				}
				switch (value) {
					case -1:
						return <span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />暂无数据</span>;
					case 0:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />在途</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 1:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />揽件</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 2:
						return <div>
							<span className="zr-tag warning" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />疑难</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 3:
						return <span className="zr-tag ok" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />签收</span>;
					case 4:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />退签</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 5:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />派件</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
					case 6:
						return <div>
							<span className="zr-tag" onClick={()=>this.__refreshExpress(data)} ><i className="fa fa-refresh zr-padding-3" />退回</span>
							<span className="zr-tag danger" onClick={()=>this.__showExpressDetail(data)} ><i className="fa fa-eye zr-padding-3" />查看详情</span>
						</div>;
				}
		}

		return value;
	},
	__loadData: function (begin, end){
		this.state.begin = begin==null?this.state.begin:begin;
		this.state.end = end==null?this.state.end:end;
		this.state.data.extend({
			begin: this.state.begin,
			end: this.state.end
		}).refresh();
	},
	__search: function (){
		var _begin = this.refs.begin_time.getValue(),
			_end = this.refs.end_time.getValue();
		this.__loadData(_begin, _end);
	},
	render:function(){
		return (
			<div className="zn-plugin-workflow-wf-my oa-admin-user-customer-order-details" toolbarItems={this.state.toolbarItems}>
				<zn.react.Group title="过滤" className="page-title" style={{backgroundColor: '#FFF'}}>
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
							<zn.react.Button onClick={this.__search} text="查询" status="warning" icon="fa-search" style={{ width: 100, marginLeft: 10 }} />
						</div>
					</div>
				</zn.react.Group>
				<zn.react.PagerView
					view="Table"
					style={{backgroundColor: '#FFF'}}
					enableFilter={true}
					checkbox={0}
					showHeader={true}
					data={this.state.data}
					columnRender={this.__onTableColumnRender}
					items={this.state.items}/>
			</div>
		);
	}
});
