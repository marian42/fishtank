import FishTank
import Log
from FlaskServer import *
import os

os.chdir("/var/www/fishtank/server/")
INIFILENAME = 'state.ini'

log = Log.Log()		
fishtank = FishTank.FishTank(INIFILENAME,log)
flaskserver = FlaskServer(fishtank,log)

print "Ready"

while (True):
	time.sleep(1)
	fishtank.tick()