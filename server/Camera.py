import pygame.camera
import pygame.image

import Config
import FishTank

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
	pygame.image.save(img, getPictureFilename(counter))
	
	FishTank.updateStatus('Ready')
	return counter

def getPictureFilename(index):
	return Config.path + Config.pictureFolder + Config.pictureFilename.format(str(index))