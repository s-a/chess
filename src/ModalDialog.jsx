import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import queen from './images/wQ.svg'
import rook from './images/wR.svg'
import bishop from './images/wB.svg'
import knight from './images/wN.svg'

class ModalDialog extends React.Component {
	onClose(res) {
		if (this.props.onHide) {
			this.props.onHide(res)
		}
	}

	render() {
		return (
			<Modal
				{...this.props}

				aria-labelledby="contained-modal-title-vcenter"
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title-vcenter">
						Promote
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div className="container-fluid">
						<div className="row">
							<div className="col-3">
								<img src={queen} alt="" srcSet="" width="64" onClick={this.onClose.bind(this, 'q')} />
							</div>
							<div className="col-3">
								<img src={rook} alt="" srcSet="" width="64" onClick={this.onClose.bind(this, 'r')}/>
							</div>
							<div className="col-3">
								<img src={bishop} alt="" srcSet="" width="64" onClick={this.onClose.bind(this, 'b')}/>
							</div>
							<div className="col-3">
								<img src={knight} alt="" srcSet="" width="64" onClick={this.onClose.bind(this, 'n')}/>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button onClick={this.onClose.bind(this, null)}>Close</Button>
				</Modal.Footer>
			</Modal>
		)
	}
}

export default ModalDialog
