var React = require('react');


module.exports = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/oa/in/getProductList', {
				wfinstance: this.props.request.search.wf_id
			}),
			items: [
				{ title: '操作', name: 'action', width: 140, textAlign: 'center' },
				{ title: '提交时间', name: 'zn_create_time', width: 140,  filter: { type: 'Input', opts: ['like'] } },
				{ title: '商品名称', name: 'product_model', convert: 'product_title',  filter: { type: 'Input', opts: ['like'] } },
				{ title: '数量', name: 'count', width: 80 },
				{ title: '单价', name: 'price', width: 80 },
				{ title: '总额', name: 'amount', width: 100 },
				{ title: '姓名', name: 'name', width: 100 },
				{ title: '电话', name: 'phone', width: 100 },
				{ title: '地址', name: 'address', width: 100 }
			],
			toolbarItems: [
				{
					text: '导出为Excel',
					status: 'warning',
					onClick: this.__downloadAsExcel,
					icon: 'fa-download'
				}
			]
		}
	},
	__downloadAsExcel: function (){
		zn.react.downloadURL(zn.http.fixURL('/oa/in/downloadProductList?wfinstance=' + this.props.request.search.wf_id));
	},
	__deleteItem: function (data) {
		var _self = this;
		zn.confirm('作废订单, 该商品库存将回到出库仓,确定作废吗？','提示', function (){
			zn.http.post('/oa/in/updateItemCount', {
				item_id: data.id
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
	__backItem: function (data){
		data.count = +data.count;
		if(data.count){
			zn.dialog({
				title: '修改数量',
				content: <div>
					<div className="zn-note" style={{margin: 6}}>注：发起修改订单数量和对应出库仓库存将同时发生变化。</div>
					<zn.react.Form
						action='/oa/in/updateItemCount'
						exts={{ item_id: data.id }}
						onSubmitBefore={(value)=>{
							if(value.count>data.count){
								return zn.notification.error('数量不能超过' + data.count + '个'), false;
							}
						}}
						onSubmitSuccess={()=>this.state.data.refresh()}
						items={[{title: '退回数量', type: 'Input', value: 1, name: 'count', attrs: { min: 1, type: 'number', max: +data.count } }]} />
				</div>
			});
		}
	},
	__trashItem: function (data){
		var _self = this;
		zn.confirm('作废订单, 该订单将不可恢复, 确定作废？','提示', function (){
			zn.http.post('/oa/in/updateItemCountWithoutStock', {
				item_id: data.id
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
	__backItemWithoutStock: function (data){
		data.count = +data.count;
		if(data.count){
			zn.dialog({
				title: '修改数量',
				content: <div>
					<div className="zn-note" style={{margin: 6}}>注：流程未完成修改订单数量暂时不会影响仓库库存量, 但数量不能少于1个。</div>
					<zn.react.Form
						action='/oa/in/updateItemCountWithoutStock'
						exts={{ item_id: data.id }}
						onSubmitBefore={(value)=>{
							if(value.count<1){
								return zn.notification.error('数量不能少于1个'), false;
							}
						}}
						onSubmitSuccess={()=>this.state.data.refresh()}
						items={[{title: '数量', value: data.count, type: 'Input', name: 'count', attrs: { min: 1, type: 'number' } }]} />
				</div>
			});
		}
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		switch (item.name) {
			case 'action':
				return <span>
					<i className="zr-tag warning fa fa-edit" onClick={()=>this.__backItem(data)} >退回数量</i>
					<i className="zr-tag danger fa fa-trash" onClick={()=>this.__deleteItem(data)} >作废订单</i>
				</span>;
		}

		return value;
	},
	render:function(){
		return (
			<zn.react.Page title='采购商品列表' className="zn-plugin-workflow-wf-my" toolbarItems={this.state.toolbarItems}>
				<zn.react.PagerView
					view="Table"
					style={{backgroundColor: '#FFF'}}
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
