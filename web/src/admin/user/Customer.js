var React = require('react');
var CustomerInvoice = require('./CustomerInvoice.js');

module.exports = React.createClass({
	getDefaultProps: function () {
		return {
			model: 'ChunRuiOACustomer'
		};
	},
	getInitialState: function () {
		return {
			data: zn.store.post('/zn.plugin.admin/model/paging', {
				model: this.props.model
			}),
			items: [
				{ title: '操作', width: 80, textAlign: 'center' },
				{ title: '名称', name: 'zn_title', width: 280, filter: { type: 'Input', opts: ['like'] } },
				{ title: '当前余额', name: 'account', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '用户名', name: 'name', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '邮箱', name: 'email', width: 150, filter: { type: 'Input', opts: ['like'] } },
				{ title: '手机号', name: 'phone', width: 110, filter: { type: 'Input', opts: ['like'] } },
				{ title: '地址', name: 'address', width: 300, filter: { type: 'Input', opts: ['like'] } },
				{ title: '发票标题', name: 'invoice_title', width: 300, filter: { type: 'Input', opts: ['like'] } },
				{ title: '税号', name: 'invoice_tax_id', width: 300, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收件人', name: 'invoice_express_name', width: 300, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收件电话', name: 'invoice_express_phone', width: 300, filter: { type: 'Input', opts: ['like'] } },
				{ title: '收件地址', name: 'invoice_express_address', width: 300, filter: { type: 'Input', opts: ['like'] } },
				{ title: '说明', name: 'zn_note' }
			],
			formItems: [
				{ title: 'Logo', name: 'logo_img', type: 'ImageUploader' },
				{ title: '名称', name: 'zn_title', type: 'Input' },
				{ title: '用户名', name: 'name', type: 'Input' },
				{ title: '密码', name: 'password', type: 'Input', attrs: { type: 'password' } },
				{ title: '邮箱', name: 'email', type: 'Input' },
				{ title: '手机号', name: 'phone', type: 'Input' },
				{ title: '地址', name: 'address', type: 'Input' },
				{ title: '发票标题', name: 'invoice_title', type: 'Input' },
				{ title: '税号', name: 'invoice_tax_id', type: 'Input' },
				{ title: '收件人', name: 'invoice_express_name', type: 'Input' },
				{ title: '收件电话', name: 'invoice_express_phone', type: 'Input' },
				{ title: '收件地址', name: 'invoice_express_address', type: 'Input' },
				{ title: '说明', name: 'zn_note', type: 'Textarea' }
			],
			toolbarItems: [
				{
					icon: 'fa-upload',
					status: 'warning',
					text: <zn.react.AjaxUploader
						action="/oa/quote/importProductQuote"
						onComplete={()=>zn.notification.success('数据导入成功')}
						hiddens={{
							vars: {
								0: 'product_model',
								1: 'price',
								2: 'express_price'
							},
							type: 'customer'
						}} >
						导入客户报价
					</zn.react.AjaxUploader>
				},
				{ text: '添加', name: 'add', icon: 'fa-plus' }
			]
		}
	},
	__addItem: function (){
		zn.dialog({
			title: '添加',
			content: <zn.react.Form
				action='/zn.plugin.admin/model/insert'
				exts={{model: this.props.model}}
				merge="values"
				onSubmitSuccess={()=>this.state.data.refresh()}
				items={this.state.formItems} />
		});
	},
	__updateItem: function (data){
		zn.dialog({
			title: '更新',
			content: <zn.react.Form
				action='/zn.plugin.admin/model/update'
				exts={{model: this.props.model, where: { id: data.id }}}
				merge="updates"
				value={data}
				onSubmitSuccess={()=>this.state.data.refresh()}
				items={this.state.formItems} />
		});
	},
	__onToolbarClick: function (item){
		switch (item.name) {
			case 'add':
				this.__addItem();
				break;
		}
	},
	__onRowClick: function (data, value, event){
		var _self = this;
		switch (data.index) {
			case 0:
				zn.confirm('确定删除该数据吗？','提示', function (){
					zn.http.post('/zn.plugin.admin/model/delete', {
						model: _self.props.model,
						where: {
							id: value.id
						}
					}).then(function (data){
						zn.toast.success('删除成功！');
						_self.state.data.refresh();
					});
				});
				break;
			case 1:
				this.__updateItem(value);
				break;
			case 2:
				zn.dialog({
					title: value.zn_title + " -- 开具发票",
					content: <CustomerInvoice customer={value.id} />
				});
				break;
		}
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		switch (columnIndex) {
			case 0:
				return <zn.react.Icons
							data={[
								{ tooltip:'删除',  icon: 'fa-remove' },
								{ tooltip:'编辑', icon: 'fa-edit' },
								{ tooltip:'开票', icon: 'fa-wpforms' }
							]}
							onClick={(value)=>this.__onRowClick(value, data)} />;
			case 1:
				return <a style={{display: 'flex', alignItems: 'center'}} href={"#"+zn.react.session.fixRelativePath('/user.customer.center?znid='+data.zn_id)} >
					{!!data.logo_img && <img style={{width: 16, height:16, marginRight: 5}} src={zn.http.fixURL(data.logo_img)} />}
					<span>{data.id + '、' + value}</span>
				</a>;
			case 2:
				if(value>0){
					return <span style={{ color: '#07ab07', fontWeight: 'bold' }}>￥{value.toFixed(2)}</span>;
				}else if(value==0){
					return <span style={{ color: '#c1bebe', fontWeight: 'bold' }}>￥{value.toFixed(2)}</span>;
				}else if(value<0){
					return <span style={{ color: '#F44336', fontWeight: 'bold' }}>￥{value.toFixed(2)}</span>;
				}
		}
	},
	render:function(){
		return (
			<zn.react.Page title='客户管理' toolbarItems={this.state.toolbarItems} onToolbarClick={this.__onToolbarClick} >
				<zn.react.PagerView
					view="Table"
					enableFilter={true}
					checkbox={0}
					showHeader={true}
					data={this.state.data}
					columnRender={this.__onTableColumnRender}
					items={this.state.items}/>
			</zn.react.Page>
		);
	}
});
