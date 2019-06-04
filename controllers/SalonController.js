const express = require('express');
const router = express.Router();
const handler = require('../utils/Errorhandler');
const Salon = require('./../models/Salon');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config/database/_namer');

const { check, validationResult } = require('express-validator/check');

//register salon
router.post(
	'/register',
	[
		check('name')
			.not()
			.isEmpty(),
		check('password')
			.not()
			.isEmpty(),
		check('phone')
			.not()
			.isEmpty()
			.isMobilePhone(),
		check('location')
			.not()
			.isEmpty(),
		check('latitude')
			.not()
			.isEmpty(),
		check('longitude')
			.not()
			.isEmpty(),
	],
	(req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		var hashedPassword = bcrypt.hashSync(req.body.password, 8);
		var token = jwt.sign({ id: req.body.phone }, config.key, {
			expiresIn: 8640000000000000000,
		});

		Salon.create({
			name: req.body.name,
			phone: req.body.phone,
			salonid: req.body.phone,
			password: hashedPassword,
			location: req.body.location,
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			accesstoken: token,
		})
			.then(user => res.json(user))
			.catch(error=>handler.handleError(res, 422, error.message));
	}
);

//login salon
router.post('/login', (req, res) => {
	Salon.findOne({
		where: {
			phone: req.body.phone,
		},
	})
		.then(user => {
			if (!user) return handler.handleError(res, 404, 'User not found');
			var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

			if (passwordIsValid) {
				res.json(user);
			} else {
				handler.handleError(res, 401, 'Unauthorzied');
			}
		})
		.catch(error => handler.handleError(res, 500, error.message));
});

//get self salon
router.get('/get_salon', (req, res) => {
	var userId = handler.validateAccessToken(req, res);
	Salon.findone({
		where: {
			salonid: userId,
		},
	})
		.then(user => res.json(user))
		.catch(error => handler.handleError(res, 500, error.message));
});
router.get('/all',(req,res)=>{
	Salon.findAll()
	.then(user => res.json(user))
		.catch(error => handler.handleError(res, 500, error.message));
})

module.exports = router;
