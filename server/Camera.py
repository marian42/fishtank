import pygame.camera
import pygame.image

import FishTank

folder = '/var/www/fishtank/pics/'
serverfolder = 'pics/'
latest = 'latest.jpg'
filename = 'img{}.jpg'
counter = 0

pygame.camera.init()

cam = pygame.camera.Camera(pygame.camera.list_cameras()[0])
		
def takePicture():
	global counter

	FishTank.updateStatus('Taking picture...')
	
	counter += 1
	
	cam.start()
	img = cam.get_image()
	cam.stop()
	
	FishTank.updateStatus('Saving picture...')
	pygame.image.save(img, folder + filename.format(str(counter)))
	
	FishTank.updateStatus('Ready')
	return counter

def getPictureFilename(self, index):
	return folder + filename.format(str(index))