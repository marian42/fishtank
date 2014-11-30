import datetime
import time

class Container(object):	
	def __init__(self, index):
		self.food = 0
		self.amount = 0
		self.filled = datetime.datetime.now()
		self.priority = 1
		self.index = index
	
	def writeToIni(self, ini):
		section = 'container' + str(self.index)
		if not ini.has_section(section):
			ini.add_section(section)
		
		ini.set(section,'food',str(self.food))
		ini.set(section,'amount',str(self.amount))
		ini.set(section,'filled',str(self.filled))
		ini.set(section,'priority',str(self.priority))
		
	def loadFromIni(self, ini):
		section = 'container' + str(self.index)
		if not ini.has_section(section):
			print("error!")
			return
		self.food = ini.getint(section, 'food')
		self.amount = ini.getfloat(section, 'amount')
		self.filled = datetime.datetime.strptime(ini.get(section, 'filled'), "%Y-%m-%d %H:%M:%S.%f")
		self.priority = ini.getint(section, 'priority')
	
	def getSerializeable(self):
		result = {}
		result['food'] = self.food
		result['amount'] = self.amount
		result['priority'] = self.priority
		result['filled'] = time.mktime(self.filled.timetuple())
		return result

	def empty(self):
		self.food = 0
		self.amount = 0
		self.filled = datetime.datetime.now()
		self.priority = 1