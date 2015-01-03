import pygame.camera
import pygame.image

class Camera(object):
	def __init__(self, fishtank):
		self.folder = '/var/www/fishtank/pics/'
		self.serverfolder = 'pics/'
		self.latest = 'latest.jpg'
		self.filename = 'img{}.jpg'
		self.counter = 0
		self.fishtank = fishtank
		Camera.instance = self

		pygame.camera.init()
		self.cam = pygame.camera.Camera(pygame.camera.list_cameras()[0])
		
	def takePicture(self):
		self.fishtank.updateStatus('Taking picture...')
		
		self.counter += 1
		
		self.cam.start()
		img = self.cam.get_image()
		self.cam.stop()
		
		self.fishtank.updateStatus('Saving picture...')			
		pygame.image.save(img, self.folder + self.filename.format(str(self.counter)))
			
		
		self.fishtank.updateStatus('Ready')
		return self.counter
	
	def getPictureFilename(self, index):
		return self.folder + self.filename.format(str(index))