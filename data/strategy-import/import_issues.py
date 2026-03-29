"""
Phase 5: Django Shell 全量导入 Strategy issues
在 Dev 环境执行: cat import_issues.py | docker exec -i plane-api-1 python manage.py shell
"""
import json
import uuid
from django.db import transaction
from django.db.models import Max
from plane.db.models import (
    Issue, IssueAssignee, IssueSequence, IssueType,
    ExtraPropertyConfig, Workspace, Project, ProjectMember, User
)

ws = Workspace.objects.get(slug='ficc')
proj = Project.objects.get(id='18b7ccc8-4b96-4af0-8c6f-76550cba28a7')
admin = ProjectMember.objects.filter(project=proj, role=20).first().member
strategy_type = IssueType.objects.get(workspace=ws, name='Strategy')

# Build display_name -> user_id map
user_map = {}
for u in User.objects.all():
    user_map[u.display_name] = str(u.id)

# Get developer EP config id
dev_ep = ExtraPropertyConfig.objects.get(workspace=ws, key='developer')
dev_ep_id = str(dev_ep.id)

# Load issues data
issues_data = json.loads(ISSUES_JSON_PLACEHOLDER)

print(f'Importing {len(issues_data)} issues...')

created_issues = []
assignee_pairs = []  # (issue, user_id)

with transaction.atomic():
    for d in issues_data:
        issue_id = uuid.uuid4()
        # Build extra_properties - resolve developer to UUID
        ep = dict(d['extra_properties'])
        devs = d.get('developers', [])
        if devs:
            first_dev = devs[0]
            if first_dev in user_map:
                ep['developer'] = user_map[first_dev]

        issue = Issue(
            id=issue_id,
            workspace=ws,
            project=proj,
            name=d['name'],
            description_html=d.get('description_html', '<p></p>'),
            type_id=strategy_type.id,
            state_id=d['state_id'],
            priority='none',
            extra_properties=ep,
            created_by=admin,
            updated_by=admin,
        )
        created_issues.append(issue)

        # Collect assignees
        for aname in d.get('assignees', []):
            if aname in user_map:
                assignee_pairs.append((issue_id, user_map[aname]))

    # Bulk create issues
    Issue.objects.bulk_create(created_issues)

    # Fix sequence_id
    last_seq = IssueSequence.objects.filter(project=proj).aggregate(m=Max('sequence'))['m'] or 0
    for idx, issue in enumerate(created_issues, 1):
        issue.sequence_id = last_seq + idx
    Issue.objects.bulk_update(created_issues, ['sequence_id'])

    # Create IssueSequence records
    IssueSequence.objects.bulk_create([
        IssueSequence(
            id=uuid.uuid4(),
            issue=i, sequence=i.sequence_id,
            project=proj, workspace=ws,
            created_by=admin, updated_by=admin,
        )
        for i in created_issues
    ], ignore_conflicts=True)

    # Create IssueAssignee records
    IssueAssignee.objects.bulk_create([
        IssueAssignee(
            id=uuid.uuid4(),
            issue_id=iid, assignee_id=uid,
            project=proj, workspace=ws,
            created_by=admin, updated_by=admin,
        )
        for iid, uid in assignee_pairs
    ], ignore_conflicts=True)

print(f'Created {len(created_issues)} issues')
print(f'Created {len(assignee_pairs)} assignee links')

# Summary by state
from collections import Counter
states = Counter()
for i in created_issues:
    states[str(i.state_id)] += 1
for sid, cnt in states.most_common():
    print(f'  state {sid}: {cnt}')
