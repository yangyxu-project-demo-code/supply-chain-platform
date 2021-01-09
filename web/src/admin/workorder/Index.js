var React = require('react');
module.exports = React.createClass({
	getDefaultProps: function () {
		return {
			model: 'AdinstallProject'
		};
	},
	getInitialState: function () {
		return {
			data: zn.store.post('/zn.plugin.admin/model/paging', {
				model: this.props.model
			}),
			items: [
				{ title: '操作', width: 60, textAlign: 'center' },
				{ title: '品牌名称', name: 'zn_title', width: 250, filter: { type: 'Input', opts: ['like'] } },
				{ title: '联系人', name: 'contact', width: 80 },
				{ title: '联系电话', name: 'phone', width: 130 },
				{ title: '邮箱', name: 'email', width: 130 },
				{ title: '创建时间', name: 'zn_create_time', width: 130 },
				{ title: '描述', name: 'zn_note' },
				{ title: '门店', name: 'zn_note' }
			],
			formItems: [
				{ title: 'Logo', name: 'logo', type: 'ImageUploader', action: '/adinstall/uploadFiles' },
				{ title: '品牌名称', name: 'zn_title', type: 'Input' },
				{ title: '联系人', name: 'contact', type: 'Input' },
				{ title: '联系电话', name: 'phone', type: 'Input' },
				{ title: '邮箱', name: 'email', type: 'Input' },
				{ title: '附件', name: 'attachments', type: 'FileUploader', action: '/adinstall/uploadFiles' },
				{ title: '描述', name: 'comment', type: 'RichEditor' },
				{ title: '说明', name: 'zn_note', type: 'Textarea' }
			],
			toolbarItems: [
				{ text: '添加', name: 'add', icon: 'fa-plus' }
			]
		}
	},
	__addItem: function (){
		zn.dialog({
			title: '添加品牌',
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
			title: '更新品牌',
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
	__onRowClick: function (data, icon, event){
		var _data = this.state.data;
		var _self = this;
		switch (data.index) {
			case 0:
				zn.confirm('确定删除该数据吗？','提示', function (){
					zn.http.post('/zn.plugin.admin/model/delete', {
						model: _self.props.model,
						where: {
							id: _data.id
						}
					}).then(function (data){
						zn.toast.success('删除成功！');
						_data.refresh();
					});
				});
				break;
			case 1:
				this.__updateItem(data);
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
								{ tooltip:'品牌门店管理', icon: 'fa-list' },
							]}
							onClick={(value)=>this.__onRowClick(value, data)} />;
			case 1:
				return <a style={{textDecoration:'underline', display: 'flex', alignItems: 'center'}} href={zn.react.session.relativeURL('/brand.info', { id: data.id })} >
					<img style={{width: 16, height:16, marginRight: 5}} src={zn.http.fixURL(data.logo)} />
					<span>{value}</span>
				</a>;
		}
	},
	render:function(){
		return (
			<zn.react.Page title='品牌管理' icon="fa-bitcoin" toolbarItems={this.state.toolbarItems} onToolbarClick={this.__onToolbarClick} >
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
