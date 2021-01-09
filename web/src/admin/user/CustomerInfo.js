require('./CustomerInfo.less');
var React = require('react');

module.exports = React.createClass({
	getInitialState: function () {
		return {
			info: null,
			buttons: []
		}
	},
	componentDidMount: function (){
		this.__loadBaseInfo(this.props.znid);
		this.__loadButtons();
	},
	__loadBaseInfo: function (zn_id){
		zn.http.post('/zn.plugin.admin/model/selectOne', {
			model: 'ChunRuiOACustomer',
			where: { zn_id: zn_id }
		}).then(function (data){
			this.setState({ info: data.result });
		}.bind(this));
	},
	__loadButtons: function (){
		zn.http.get('/zn.plugin.admin/var/getByPidForRights?pid=3')
		.then(function (data){
			this.setState({ buttons: data.result });
		}.bind(this));
	},
	__onSuccess: function (){
		zn.notification.success('充值成功！');
		this.__loadBaseInfo(this.props.znid);
	},
	__recharge: function () {
		zn.dialog({
			title: '请填写充值金额',
			content: <div>
				<div className="zn-note" style={{margin: 6}}>注：确认好充值金额后再填写。</div>
				<zn.react.Form
					action='/oa/customer_bill/recharge'
					exts={ {id: this.state.info.id } }
					onSubmitSuccess={()=>this.__onSuccess()}
					items={[
						{ title: '充值金额', name: 'account', type: 'Input', suffix: '￥', required: true },
						{ title: '说明', name: 'zn_note', type: 'Textarea', required: true }
					]} />
			</div>
		});
	},
	__onButtonClick: function (btn, index){
		switch(btn.id){
			case 4:
				return this.__recharge();
			case 5:
				return zn.react.session.relativeJump('/user.customer.bill?customerId=' + this.state.info.id);
			case 6:
				return null;
		}
	},
	render: function(){
		if(!this.state.info){
			return <zn.react.DataLoader content="正在加载中..." loader="timer" />;
		}
		return (
			<div className="zn-plugin-admin-base-info oa-admin-user-customer-info">
				<div className="right">
					<div className="base">
						{this.state.info.logo_img && <img className="logo" src={zn.http.fixURL(this.state.info.logo_img)} />}
						<span className="title">{this.state.info.zn_title}</span>
					</div>
					<div className="account">
						<div className="info">账户余额(元)：<span className="amount">￥{(this.state.info.account||0).toFixed(2)}</span></div>
						<div className="action">
							{
								this.state.buttons.map(function (btn, index){
									if(btn.id == 4){
										btn.icon = 'fa-sign-in';
										btn.status = 'warning';
									}else if(btn.id == 5){
										btn.icon = 'fa-list-ul';
									}else if(btn.id == 6){
										btn.icon = 'fa-download';
									}

									return <zn.react.Button index={index} onClick={()=>this.__onButtonClick(btn, index)} text={btn.zn_title} icon={btn.icon} status={btn.status||'primary'} style={{width: 100}} />;
								}.bind(this))
							}
						</div>
					</div>
					<div className="item-group">
						<div className="group-title">联系方式</div>
						<div className="item">
							<span className="item-key">姓名: </span>
							<span className="item-value">{this.state.info.name}</span>
						</div>
						<div className="item">
							<span className="item-key">邮箱: </span>
							<span className="item-value">{this.state.info.email}</span>
						</div>
						<div className="item">
							<span className="item-key">电话号码: </span>
							<span className="item-value">{this.state.info.phone}</span>
						</div>
						<div className="item">
							<span className="item-key">地址: </span>
							<span className="item-value">{this.state.info.address}</span>
						</div>
						<div className="item">
							<span className="item-key">说明: </span>
							<span className="item-value">{this.state.info.zn_note}</span>
						</div>
						<div className="item">
							<span className="item-key">创建时间: </span>
							<span className="item-value">{this.state.info.zn_create_time}</span>
						</div>
					</div>
					<div className="item-group">
						<div className="group-title">开票信息</div>
						<div className="item">
							<span className="item-key">标题: </span>
							<span className="item-value">{this.state.info.invoice_title}</span>
						</div>
						<div className="item">
							<span className="item-key">税号: </span>
							<span className="item-value">{this.state.info.invoice_tax_id}</span>
						</div>
						<div className="item">
							<span className="item-key">收件人: </span>
							<span className="item-value">{this.state.info.invoice_express_name}</span>
						</div>
						<div className="item">
							<span className="item-key">收件人电话: </span>
							<span className="item-value">{this.state.info.invoice_express_phone}</span>
						</div>
						<div className="item">
							<span className="item-key">收件人地址: </span>
							<span className="item-value">{this.state.info.invoice_express_address}</span>
						</div>
					</div>
				</div>
			</div>
		);
	}
});
