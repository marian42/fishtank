from subprocess import call
import shutil

class Camera(object):
	def __init__(self, fishtank):
		self.folder = '/var/www/fishtank/pics/'
		self.serverfolder = 'pics/'
		self.latest = 'latest.jpg'
		self.filename = 'img{}.jpg'
		self.counter = 0
		self.fishtank = fishtank
		Camera.instance = self
		
	def takePicture(self, save = True):
		self.fishtank.updateStatus('Taking picture...')
		exitcode = call('fswebcam --no-banner --skip 3 -r 640x480 --jpeg 70 ' + self.folder + self.latest, shell=True)
		if (save and exitcode == 0):
			self.fishtank.updateStatus('Saving picture...')			
			self.counter += 1
			shutil.copyfile(self.folder + self.latest, self.folder + self.filename.format(str(self.counter)))
			self.fishtank.updateStatus('Ready')
			return self.counter
		self.fishtank.updateStatus('Ready')
		return -1
		
	'''def getPicturUrl(self, index):
		return 'http://192.168.2.9/fishtank/' + sef.serverfolder + self.filename.format(index)'''
		
	def getPictureFilename(self, index):
		return self.folder + self.filename.format(str(index))