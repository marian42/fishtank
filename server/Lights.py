from subprocess import call

import FishTank

value = False

def load(ini):
	global value

	section = 'lights'
	if not ini.has_section(section):
		print("error!")
		return
	value = ini.get(section, 'value') == 'True'

def save(ini):
	section = 'lights'
	if not ini.has_section(section):
		ini.add_section(section)
	ini.set(section,'value',str(value))

def broadcast():
	call(["python","/var/www/fishtank/server/elro.py", "1", "1" if value else "0"])

def switch():
	global value

	value = not value
	broadcast()
	FishTank.increaseVersion()