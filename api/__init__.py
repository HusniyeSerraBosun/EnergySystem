from .create_organization import router as create_org_router
from .list_organizations import router as list_orgs_router
from .create_plant import router as create_plant_router
from .list_plants import router as list_plants_router
from .create_user import router as create_user_router
from .list_users import router as list_users_router
from .list_rt_consumption import router as list_rt_consumption_router
from .list_rt_generation import router as list_rt_generation_router
from .list_mpc import router as list_mpc_router
from .list_smp import router as list_smp_router
from .list_demand_forecast import router as list_demand_forecast_router
from .create_plant_event import router as create_plant_event_router
from .finish_plant_event import router as finish_plant_event_router
from .list_plant_events import router as list_plant_events_router
from .login import router as login_router

all_routers=[
    create_org_router,
    list_orgs_router,
    create_plant_router,
    list_plants_router,
    create_user_router,
    list_users_router,
    list_rt_consumption_router,
    list_rt_generation_router,
    list_mpc_router,
    list_smp_router,
    list_demand_forecast_router,
    create_plant_event_router,
    finish_plant_event_router,
    list_plant_events_router,
    login_router
]

