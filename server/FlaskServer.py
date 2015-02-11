from thread import *
from flask import *
import json
import string
import datetime
import time
import configparser
from flask_login import *
from flask.ext.login import (LoginManager, UserMixin, login_required, login_user, logout_user, current_user)
import hashlib
import flask.ext.login
from random import randint

from crossdomainflask import *
from EventList import *

class User(UserMixin):
    def __init__(self, username, hash):
        self.name = username
        self.hash = hash

    @property
    def id(self):
        return self.name

class FlaskServer(object):
	def __init__(self, fishtank, log):
		self.users = self.loadUsers()
		
		self.fishtank = fishtank
		self.log = log
		
		self.login_manager = LoginManager()
		self.server = Flask(__name__, static_folder='../', static_url_path='')
		self.server.secret_key = '123456123456'
		self.login_manager.init_app(self.server)
		#Enable this only in development mode
		#start_new_thread(self.server.run, ("0.0.0.0",), {"threaded": True})
			# 0.0.0.0 - visible for outside network
			# threaded: handle multiple requests at once
		self.server.config.update(PROPAGATE_EXCEPTIONS = True)
			# show exceptions on shell/log
		
		@self.login_manager.user_loader
		def load_user(userid):
			for user in self.users:
				if user.name == userid:
					return user
			return None
		
		@self.server.route('/')
		def root():
			return self.server.send_static_file('index.html')
		
		@self.server.route("/api/status")		
		def getStatus():
			data = self.fishtank.getSerializeable()
			data['user'] = current_user.name if current_user.is_authenticated() else None
			return Response(json.dumps(data),  mimetype='application/json')
			
		@self.server.route("/api/log")
		def getLog():
			data = self.log.getRecentEntries(count = int(request.args.get('entries')), minlevel = int(request.args.get('minlevel')), page = int(request.args.get('page')))
			return Response(json.dumps(data), mimetype='application/json')
			
		@self.server.route("/api/updatecontainers", methods=['POST'])
		@login_required
		def updateContainers():
			containers = string.split(request.form['containers'],',')
			food = int(request.form['food'])
			amount = float(request.form['amount'])
			priority = int(request.form['priority'])
			
			for c in containers:
				if (c == ''):
					continue
				if (food != -1):
					self.fishtank.foodStore.container[int(c)].food = food
				if (amount != -1):
					self.fishtank.foodStore.container[int(c)].amount = amount
				if (priority != -1):
					self.fishtank.foodStore.container[int(c)].priority = priority
				if (food != -1 and amount != -1):
					self.fishtank.foodStore.container[int(c)].filled = datetime.datetime.now()
			
			self.log.write(message = 'Updated containers (' + str(len(containers)-1) + ' containers set)', startedby = current_user.id);
			return 'ok'
			
		@self.server.route("/api/updateevent", methods=['POST'])		
		@login_required
		def updateEvent():
			event = self.fishtank.eventList.update(request.form)		
			self.log.write(message = ('Updated' if request.form['event'] != '-1' else 'Created') + ' event (' + EventList.names[event.type] + ' at ' + str(event.hour) + ':' + ('0' if event.minute < 10 else '') + str(event.minute) + ')', startedby = current_user.id)
			return 'ok'
			
		@self.server.route("/api/deleteevent", methods=['POST'])		
		@login_required
		def deleteEvent():
			event = self.fishtank.eventList.getEvent(int(request.form['id']))
			if event == None:
				print 'error'
				return 'error' # TODO
			self.fishtank.eventList.events.remove(event)
			self.log.write(message = 'Deleted event (' + EventList.names[event.type] + ' at ' + str(event.hour) + ':' + ('0' if event.minute < 10 else '') + str(event.minute) + ')', startedby = current_user.id)
			return 'ok'
			
		@self.server.route("/api/takepicture", methods=['POST'])		
		def takePicture():
			id = self.fishtank.camera.takePicture();
			username = 'guest'
			if current_user.is_authenticated():
				username = current_user.id
			self.log.write(message = 'Took picture', level = 1, image = id, startedby = username)
			return 'ok'
			
		@self.server.route("/api/switchlights", methods=['POST'])		
		@login_required
		def switchLights():
			self.fishtank.lights.switch()
			self.log.write(message = 'Switched lights (' + ('On' if self.fishtank.lights.value else 'Off') + ')', level = 1, startedby = current_user.id)
			return 'ok'
			
		@self.server.route("/api/flashled", methods=['POST'])		
		def flashLED():
			print(current_user)
			print(request.form['color'])
			self.fishtank.fishFeeder.flashHex(request.form['color'],1)
			return 'ok'
		
		@self.server.route("/api/calibrate", methods=['POST'])		
		@login_required
		def calibrate():
			self.fishtank.fishFeeder.calibrate()
			self.log.write(message = 'Calibrated feeder ', level = 1, startedby = current_user.id)
			return 'ok'
		
		@self.server.route("/api/checkforupdate")		
		def checkForUpdate():
			oldversion = int(request.args['version'])
			timeout = 10
			tstart = time.time()
			while (time.time() < tstart + timeout):
				if (self.fishtank.version > oldversion):					
					return 'true'
				time.sleep(0.1)
			return 'false'
		
		@self.server.route("/api/move", methods=['POST'])
		@login_required
		def moveFeeder():
			self.fishtank.fishFeeder.moveTo(int(request.form['to']))
			self.log.write(message = 'Moved feeder to position ' + str(int(request.form['to'])+1), level = 1, startedby = current_user.id)
			return 'ok'
			
		@self.server.route("/api/dump", methods=['POST'])
		@login_required
		def dump():
			container = self.fishtank.foodStore.container[int(request.form['to'])]
			self.fishtank.fishFeeder.moveToAndDump(int(request.form['to']))
			if (FishTank.FishTank.instance.fishFeeder.status == fishfeeder.FishFeederStatus.ERROR):
				Log.Log.instance.write(message = 'Manual feeding failed (mechanical failure).', level = 3, image = imageId, startedby = current_user.id)
				return
			
			oldsaturation = self.fishtank.getSaturation()
			if container.amount != 0:
				self.fishtank.setSaturation(oldsaturation + container.amount)
			container.empty()
			self.log.write(title= "Fed fish", message = 'Manually fed container ' + str(container.index + 1) + ' (Food ' + str(container.food) + '), Saturation: ' + "{0:.1f}".format(oldsaturation) + ' -> ' + "{0:.1f}".format(oldsaturation + container.amount) + ' (+' + "{0:.1f}".format(container.amount) + ')', level = 2, startedby = current_user.id)
			return 'ok'
			
		@self.server.route("/api/enableschedule", methods=['POST'])
		@login_required
		def enableSchedule():
			self.fishtank.eventList.enabled = request.values.get('value') == 'true'
			self.log.write(title="Enabled Scheduling" if self.fishtank.eventList.enabled else "Disabled Scheduling", message = "Enabled Scheduling" if self.fishtank.eventList.enabled else "Disabled Scheduling", level = 0, startedby = current_user.id)
			return 'ok'
			
		@self.server.route('/api/login', methods=['POST'])
		def login():
			user = load_user(request.values.get('username'))
			m = hashlib.sha512()
			m.update(request.values.get('password'))
			#print m.hexdigest()
			if user and user.hash == m.hexdigest():				
				login_user(user, remember = True)
				print('login successful (' + user.name + ')')
				return 'ok'
			else:
				print('login failed (' + request.values.get('username') + ')')			
				return 'error'
				
		@self.server.route("/api/logout", methods=['POST'])
		@login_required
		def logout():
			logout_user()
			return 'ok'
	
	def loadUsers(self):
		ini = configparser.ConfigParser()
		ini.read('users.ini')
		
		usernames = ini.sections()
		users = [User(username, ini.get(username,'hash')) for username in usernames]
		
		return users