from fastapi import FastAPI

app = FastAPI(title='TravelAI API', version='0.1.0')


@app.get('/health')
def get_health() -> dict[str, str]:
  return {'status': 'ok'}

