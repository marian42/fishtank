from Container import *

class FoodStore(object):
	size = 27
	
	def __init__(self):
		self.container = [Container(i) for i in range(self.size)]
	
	def save(self, ini):		
		for i in range(self.size):
			self.container[i].writeToIni(ini)

	def load(self, ini):
		for i in range(self.size):
			self.container[i].loadFromIni(ini)
			
	def getSerializeable(self):
		return [c.getSerializeable() for c in self.container]