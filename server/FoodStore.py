from Container import Container
size = 27

container = [Container(i) for i in range(size)]

def save(ini):	
	for i in range(size):
		container[i].writeToIni(ini)

def load(ini):
	for i in range(size):
		container[i].loadFromIni(ini)
	
def getSerializeable():
	return [c.getSerializeable() for c in container]