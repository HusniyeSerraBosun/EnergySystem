from .create_organization import router as create_org_router
from .list_organizations import router as list_orgs_router
from .create_plant import router as create_plant_router
from .list_plants import router as list_plants_router
from .create_user import router as create_user_router
from .list_users import router as list_users_router
from .login import router as login_router
all_routers=[
    create_org_router,
    list_orgs_router,
    create_plant_router,
    list_plants_router,
    create_user_router,
    list_users_router,
    login_router
]

