var React = require('react');
module.exports = React.createClass({
	getInitialState: function () {
		return {
			products: null,
			sale_receipt: null,
			values: []
		}
	},
	componentDidMount: function (){
		this.__loadDetailList();
	},
	__parseData: function (data){
		var _products = [],
			_psn = {};
		data.forEach(function (item){
			if(item.product_model && _psn[item.product_model]){
				_psn[item.product_model].count += +item.count;
				_psn[item.product_model].total_sum += +item.total_sum;
			}else {
				if(item.product_title){
					_psn[item.product_model] = {
						product_id: item.product_id,
						product_title: item.product_title,
						product_model: item.product_model,
						count: +item.count,
						total_sum: +item.total_sum
					}
				}
			}
		});
		this.state.values = [];
		for(var key in _psn){
			_products.push(_psn[key]);
			this.state.values.push({ product_model: _psn[key].product_model, count: _psn[key].count });
		}
		this.state.products = _products;
		this.forceUpdate();
	},
	__loadDetailList: function (){
		zn.http.post('/oa/sale/getWorkFlowInstanceDetails', {
			wfinstance: this.props.wf_id
		}).then(function (data){
			if(data.status==200){
				this.state.sale_receipt = data.result[0][0];
				this.state.customer = this.state.sale_receipt.customer;
				this.__parseData(data.result[1]);
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this));
	},
	__onCreateSuccess: function (instanceId){
		zn.http.post('/oa/sale/updateOutWfs', {
			sale_receipt_id: this.state.sale_receipt.id,
			wf_instance_id: instanceId
		});
		zn.react.session.relativeJump('/znpluginworkflow.wfinstance?instanceId='+instanceId);
	},
	__createInstance: function (index){
		zn.dialog({
			title: '开单出库',
			content: <zn.plugin.workflow.CreateInstance baseValue={{customer: +this.state.customer}} data={[this.state.values]} id={9} onCreateSuccess={this.__onCreateSuccess} />
		});
	},
	__onToolbarClick: function (item){
		switch (item.name) {
			case 'add':
				this.__createInstance();
				break;
		}
	},
	__renderOutWfs: function (){
		if(this.state.sale_receipt){
			var _wfs = this.state.sale_receipt.out_wfs.split(',').filter(function(value){
				if(value){
					return value;
				}
			});
			if(_wfs.length){
				return (
					<zn.react.Group style={{backgroundColor: '#FFF'}} title="已创建开单出库流程" className="table">
						{
							_wfs.map(function (wf, index){
								return <div style={{ padding: 5 }}><a href={zn.react.session.relativeURL('/znpluginworkflow.wfinstance', { instanceId: wf })}>开单出库流程 {wf}</a></div>
							})
						}
					</zn.react.Group>
				);
			}
		}
	},
	__renderTable: function (){
		if(this.state.products){
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
							return <ul className="table-row item">
								{
									Object.keys(item).map(function (key, index){
										if(key=='product_id'){
											return null;
										}
										return <li style={{flex: 1}} data-tooltip={item[key]}><span>{item[key]}</span></li>;
									})
								}
							</ul>
						})
					}
				</zn.react.Group>
			);
		}else {
			return <zn.react.DataLoader loader="timer" content="正在加载中..." />;
		}
	},
	render:function(){
		return (
			<div className="zn-plugin-workflow-wf-my zn-plugin-workflow-instance-flow-table-info">
				{this.__renderTable()}
			</div>
		);
	}
});
